// REPAIR SIMULATOR — executável offline.
// O jogo inteiro vai embutido no .exe (game.zip como recurso). O programa sobe um servidor
// HTTP local só em 127.0.0.1 e abre o jogo numa janela de aplicativo do Edge (sem barra de endereço).
// Nada é baixado nem enviado para a internet.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("REPAIR SIMULATOR")]
[assembly: AssemblyProduct("REPAIR SIMULATOR")]
[assembly: AssemblyDescription("Assistência técnica de dia, cassino à noite.")]
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]

static class Program
{
    const int PORT = 47817;
    static readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
    static DateTime lastPing = DateTime.MinValue;
    static volatile bool gotPing = false;
    static volatile bool quit = false;
    static Process browser;

    [STAThread]
    static void Main(string[] args)
    {
        bool serverOnly = Array.IndexOf(args, "--server-only") >= 0;
        TcpListener listener = null;
        try
        {
            listener = new TcpListener(IPAddress.Loopback, PORT);
            listener.Start();
        }
        catch (SocketException)
        {
            // Já tem um jogo aberto: só abre outra janela apontando para ele.
            if (!serverOnly && IsOurServer()) { LaunchBrowser(); return; }
            MessageBox.Show("A porta " + PORT + " está ocupada por outro programa.\nFeche-o e tente de novo.", "REPAIR SIMULATOR", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        try { LoadGame(); }
        catch (Exception e)
        {
            MessageBox.Show("Não consegui carregar os arquivos do jogo:\n" + e.Message, "REPAIR SIMULATOR", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var t = new Thread(() => AcceptLoop(listener));
        t.IsBackground = true;
        t.Start();

        if (!serverOnly) LaunchBrowser();

        DateTime start = DateTime.Now;
        while (!quit)
        {
            Thread.Sleep(1000);
            if (serverOnly) continue;
            bool alive = false;
            try { alive = browser != null && !browser.HasExited; } catch { }
            if (alive) continue;                                               // janela aberta
            if (gotPing && (DateTime.Now - lastPing).TotalSeconds < 150) continue; // janela aberta em outro processo
            if (!gotPing && (DateTime.Now - start).TotalSeconds < 90) continue;    // ainda abrindo
            break;
        }
        try { listener.Stop(); } catch { }
    }

    static void LoadGame()
    {
        using (var rs = Assembly.GetExecutingAssembly().GetManifestResourceStream("game.zip"))
        using (var zip = new ZipArchive(rs, ZipArchiveMode.Read))
        {
            foreach (var e in zip.Entries)
            {
                if (e.FullName.EndsWith("/")) continue;
                using (var s = e.Open())
                using (var ms = new MemoryStream())
                {
                    s.CopyTo(ms);
                    Files[e.FullName.Replace('\\', '/')] = ms.ToArray();
                }
            }
        }
    }

    static bool IsOurServer()
    {
        try
        {
            var req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + PORT + "/__hello");
            req.Timeout = 1500;
            using (var resp = req.GetResponse())
            using (var r = new StreamReader(resp.GetResponseStream()))
                return r.ReadToEnd().Contains("doki");
        }
        catch { return false; }
    }

    static void LaunchBrowser()
    {
        string url = "http://127.0.0.1:" + PORT + "/index.html?app=1";
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        // mantém os saves de quem jogou com o nome antigo
        string oldDir = Path.Combine(appData, "DokiDokiConsertoClub"), newDir = Path.Combine(appData, "RepairSimulator");
        try { if (Directory.Exists(oldDir) && !Directory.Exists(newDir)) Directory.Move(oldDir, newDir); } catch { }
        string profile = Path.Combine(newDir, "perfil");
        try { Directory.CreateDirectory(profile); } catch { }
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] candidates = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
        };
        foreach (var exe in candidates)
        {
            if (!File.Exists(exe)) continue;
            var psi = new ProcessStartInfo(exe,
                "--app=\"" + url + "\" --user-data-dir=\"" + profile + "\" --window-size=1366,820 " +
                "--no-first-run --no-default-browser-check --disable-sync --autoplay-policy=no-user-gesture-required " +
                "--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows " +
                "--disable-features=Translate,msEdgeSidebarV2,msImplicitSignin,msEdgeShopping");
            psi.UseShellExecute = false;
            try { browser = Process.Start(psi); return; } catch { }
        }
        // Sem Edge/Chrome: abre no navegador padrão.
        try { Process.Start(url); } catch { }
    }

    static void AcceptLoop(TcpListener l)
    {
        while (true)
        {
            TcpClient c;
            try { c = l.AcceptTcpClient(); } catch { return; }
            ThreadPool.QueueUserWorkItem(o => Handle((TcpClient)o), c);
        }
    }

    static string ReadHead(NetworkStream s)
    {
        var buf = new List<byte>(512);
        int prev3 = 0;
        while (true)
        {
            int b;
            try { b = s.ReadByte(); } catch { return null; }
            if (b < 0) return null;
            buf.Add((byte)b);
            prev3 = ((prev3 << 8) | b) & 0x7FFFFFFF;
            if (buf.Count >= 4 && buf[buf.Count - 4] == 13 && buf[buf.Count - 3] == 10 && buf[buf.Count - 2] == 13 && buf[buf.Count - 1] == 10)
                return Encoding.ASCII.GetString(buf.ToArray());
            if (buf.Count > 16384) return null;
        }
    }

    static void Handle(TcpClient c)
    {
        using (c)
        {
            NetworkStream s = c.GetStream();
            s.ReadTimeout = 30000;
            while (true)
            {
                string head = ReadHead(s);
                if (head == null) return;
                string[] lines = head.Split(new[] { "\r\n" }, StringSplitOptions.None);
                string[] first = lines[0].Split(' ');
                if (first.Length < 2) return;
                string method = first[0];
                string path = first[1];
                int q = path.IndexOf('?'); if (q >= 0) path = path.Substring(0, q);
                try { path = Uri.UnescapeDataString(path); } catch { }
                string range = null; bool close = false;
                for (int i = 1; i < lines.Length; i++)
                {
                    string ln = lines[i];
                    if (ln.StartsWith("Range:", StringComparison.OrdinalIgnoreCase)) range = ln.Substring(6).Trim();
                    if (ln.StartsWith("Connection:", StringComparison.OrdinalIgnoreCase) && ln.IndexOf("close", StringComparison.OrdinalIgnoreCase) >= 0) close = true;
                }

                if (path == "/__ping" || path == "/__hello")
                {
                    if (path == "/__ping") { gotPing = true; lastPing = DateTime.Now; }
                    Send(s, 200, "text/plain", Encoding.ASCII.GetBytes("doki"), 0, 4, 4, method, null);
                    if (close) return; continue;
                }
                if (path == "/__status")
                {
                    byte[] st = Encoding.ASCII.GetBytes("doki ping=" + (gotPing ? "1" : "0"));
                    Send(s, 200, "text/plain", st, 0, st.Length, st.Length, method, null);
                    if (close) return; continue;
                }
                if (path == "/__quit")
                {
                    Send(s, 200, "text/plain", Encoding.ASCII.GetBytes("tchau"), 0, 5, 5, method, null);
                    new Thread(() => { Thread.Sleep(400); try { if (browser != null && !browser.HasExited) browser.Kill(); } catch { } quit = true; }).Start();
                    return;
                }
                if (path == "/") path = "/index.html";
                byte[] data;
                if (!Files.TryGetValue(path.TrimStart('/'), out data))
                {
                    byte[] nf = Encoding.UTF8.GetBytes("404");
                    Send(s, 404, "text/plain", nf, 0, nf.Length, nf.Length, method, null);
                    if (close) return; continue;
                }
                string type = Mime(path);
                if (range != null && range.StartsWith("bytes="))
                {
                    // suporte a Range (áudio/música)
                    string[] se = range.Substring(6).Split(',')[0].Split('-');
                    long a = 0, b = data.Length - 1;
                    if (se[0].Length > 0) a = long.Parse(se[0]);
                    if (se.Length > 1 && se[1].Length > 0) b = Math.Min(long.Parse(se[1]), data.Length - 1);
                    if (se[0].Length == 0 && se.Length > 1 && se[1].Length > 0) { a = Math.Max(0, data.Length - long.Parse(se[1])); b = data.Length - 1; }
                    if (a > b || a >= data.Length) { Send(s, 416, type, new byte[0], 0, 0, data.Length, method, "bytes */" + data.Length); if (close) return; continue; }
                    Send(s, 206, type, data, (int)a, (int)(b - a + 1), data.Length, method, "bytes " + a + "-" + b + "/" + data.Length);
                }
                else Send(s, 200, type, data, 0, data.Length, data.Length, method, null);
                if (close) return;
            }
        }
    }

    static void Send(NetworkStream s, int code, string type, byte[] data, int off, int len, long total, string method, string contentRange)
    {
        string status = code == 200 ? "OK" : code == 206 ? "Partial Content" : code == 404 ? "Not Found" : "Range Not Satisfiable";
        var sb = new StringBuilder();
        sb.Append("HTTP/1.1 ").Append(code).Append(' ').Append(status).Append("\r\n");
        sb.Append("Content-Type: ").Append(type).Append("\r\n");
        sb.Append("Content-Length: ").Append(len).Append("\r\n");
        sb.Append("Accept-Ranges: bytes\r\n");
        sb.Append("Cache-Control: no-cache\r\n");
        sb.Append("Connection: keep-alive\r\n");
        if (contentRange != null) sb.Append("Content-Range: ").Append(contentRange).Append("\r\n");
        sb.Append("\r\n");
        byte[] h = Encoding.ASCII.GetBytes(sb.ToString());
        try
        {
            s.Write(h, 0, h.Length);
            if (method != "HEAD" && len > 0) s.Write(data, off, len);
        }
        catch { }
    }

    static string Mime(string p)
    {
        string e = Path.GetExtension(p).ToLowerInvariant();
        switch (e)
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".txt": return "text/plain; charset=utf-8";
            case ".png": return "image/png";
            case ".ico": return "image/x-icon";
            case ".glb": return "model/gltf-binary";
            case ".ogg": return "audio/ogg";
            case ".mp3": return "audio/mpeg";
            case ".woff2": return "font/woff2";
            default: return "application/octet-stream";
        }
    }
}
