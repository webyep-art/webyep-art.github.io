import http.server
import socketserver
import webbrowser
import threading

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

# Запуск сервера в отдельном потоке
def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()

# Открываем браузер
webbrowser.open(f"http://localhost:{PORT}")

# Держим скрипт живым
server_thread.join()
