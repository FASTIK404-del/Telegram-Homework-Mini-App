import json
import os
import time
import hashlib
import hmac
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler


def json_response(handler, status, data):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def verify_telegram_init_data(init_data, bot_token):
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        received_hash = parsed.pop("hash", None)
        if not received_hash:
            return None

        auth_date = int(parsed.get("auth_date", "0"))
        if auth_date > time.time() + 60 or time.time() - auth_date > 86400:
            return None

        data_check_string = "\n".join(
            f"{key}={value}" for key, value in sorted(parsed.items())
        )
        secret_key = hmac.new(
            b"WebAppData", bot_token.encode(), hashlib.sha256
        ).digest()
        calculated_hash = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            return None

        user_data = json.loads(parsed.get("user", "{}"))
        return user_data if isinstance(user_data, dict) else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        bot_token = os.environ.get("BOT_TOKEN")
        chat_id = os.environ.get("SUPPORT_CHAT_ID")

        if not bot_token or not chat_id:
            return json_response(
                self, 500, {"ok": False, "message": "Сервер не настроен"}
            )

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 12000:
                return json_response(
                    self, 413, {"ok": False, "message": "Слишком большой запрос"}
                )

            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Invalid payload")

            init_data = payload.get("initData", "")
            user = verify_telegram_init_data(init_data, bot_token)
            if not user:
                return json_response(
                    self, 401,
                    {"ok": False, "message": "Открой FLOWLY через Telegram"}
                )

            kind = str(payload.get("type", "")).strip()
            subject = str(payload.get("subject", "")).strip()
            message = str(payload.get("message", "")).strip()

            if kind not in ("Ошибка", "Предложение", "Вопрос"):
                return json_response(
                    self, 400, {"ok": False, "message": "Выбери тип обращения"}
                )
            if not subject or len(subject) > 100:
                return json_response(
                    self, 400, {"ok": False, "message": "Проверь тему обращения"}
                )
            if not message or len(message) > 2000:
                return json_response(
                    self, 400, {"ok": False, "message": "Проверь описание"}
                )

            first_name = str(user.get("first_name", ""))
            username = str(user.get("username", "не указан"))
            user_id = str(user.get("id", "неизвестен"))

            text = (
                "📩 Новое обращение FLOWLY\n\n"
                f"Тип: {kind}\n"
                f"Тема: {subject}\n\n"
                f"Описание:\n{message}\n\n"
                f"Отправитель: {first_name}\n"
                f"Username: @{username}\n"
                f"Telegram ID: {user_id}"
            )

            request_data = urllib.parse.urlencode({
                "chat_id": chat_id,
                "text": text
            }).encode("utf-8")

            request = urllib.request.Request(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                data=request_data,
                method="POST"
            )

            with urllib.request.urlopen(request, timeout=10) as response:
                telegram_result = json.loads(response.read().decode("utf-8"))

            if not telegram_result.get("ok"):
                return json_response(
                    self, 502,
                    {"ok": False, "message": "Telegram не принял сообщение"}
                )

            return json_response(
                self, 200, {"ok": True, "message": "Обращение отправлено"}
            )

        except (ValueError, json.JSONDecodeError):
            return json_response(
                self, 400, {"ok": False, "message": "Некорректные данные"}
            )
        except Exception:
            return json_response(
                self, 502, {"ok": False, "message": "Не удалось отправить обращение"}
            )

    def do_GET(self):
        return json_response(
            self, 405, {"ok": False, "message": "Используй POST"}
        )
