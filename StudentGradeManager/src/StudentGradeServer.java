import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.HashMap;

/**
 * Small Java HTTP server for the Student Grade Management System.
 * Uses only Java's built-in HTTP server; no third-party libraries required.
 */
public class StudentGradeServer {
    private static final int PORT = 8080;
    private static final Path WEB_ROOT = Path.of("web");

    // Parallel arrays: each minimum score corresponds to the grade at the same index.
    private static final int[] GRADE_MINIMUMS = {80, 70, 60, 50, 0};
    private static final String[] GRADE_LABELS = {"A", "B", "C", "D", "F"};

    public static void main(String[] args) throws IOException {
        if (!Files.isDirectory(WEB_ROOT)) {
            System.err.println("Could not find the 'web' folder. Run this command from the project root.");
            System.exit(1);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/grade", StudentGradeServer::handleGrade);
        server.createContext("/", StudentGradeServer::serveStatic);
        server.setExecutor(null);
        server.start();

        System.out.println("Student Grade Management System is running.");
        System.out.println("Open http://localhost:" + PORT + " in your browser.");
        System.out.println("Press Ctrl+C to stop the server.");
    }

    private static void handleGrade(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendText(exchange, 405, "Method not allowed");
            return;
        }

        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String rawScore = params.get("score");
        int score;
        try {
            score = Integer.parseInt(rawScore == null ? "" : rawScore);
        } catch (NumberFormatException ex) {
            sendJson(exchange, 400, "{\"error\":\"Score must be a whole number.\"}");
            return;
        }

        if (score < 0 || score > 100) {
            sendJson(exchange, 400, "{\"error\":\"Score must be between 0 and 100.\"}");
            return;
        }

        String grade = "F";
        for (int i = 0; i < GRADE_MINIMUMS.length; i++) {
            if (score >= GRADE_MINIMUMS[i]) {
                grade = GRADE_LABELS[i];
                break;
            }
        }
        sendJson(exchange, 200, "{\"score\":" + score + ",\"grade\":\"" + grade + "\"}");
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> values = new HashMap<>();
        if (query == null || query.isBlank()) return values;
        for (String pair : query.split("&")) {
            String[] parts = pair.split("=", 2);
            String key = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
            String value = parts.length > 1
                    ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "";
            values.put(key, value);
        }
        return values;
    }

    private static void serveStatic(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();
        if (requestPath.equals("/")) requestPath = "/index.html";

        // Only serve files located directly beneath the web directory.
        String safeName = Path.of(requestPath).getFileName().toString();
        Path file = WEB_ROOT.resolve(safeName).normalize();
        if (!file.startsWith(WEB_ROOT.normalize()) || !Files.isRegularFile(file)) {
            sendText(exchange, 404, "File not found");
            return;
        }

        String contentType = switch (safeName.substring(safeName.lastIndexOf('.') + 1).toLowerCase()) {
            case "html" -> "text/html; charset=utf-8";
            case "css" -> "text/css; charset=utf-8";
            case "js" -> "application/javascript; charset=utf-8";
            default -> "application/octet-stream";
        };
        byte[] bytes = Files.readAllBytes(file);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private static void sendText(HttpExchange exchange, int status, String message) throws IOException {
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
