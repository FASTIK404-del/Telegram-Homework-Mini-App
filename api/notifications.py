import urllib.error
import json
import os
import time
import hmac
import hashlib
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler


def send_json(handler, status, data):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def verify_init_data(init_data, bot_token):
    try:
        parsed = dict(
            urllib.parse.parse_qsl(init_data, keep_blank_values=True)
        )
        received_hash = parsed.pop("hash", None)

        if not received_hash:
            return None

        auth_date = int(parsed.get("auth_date", "0"))

        if auth_date > time.time() + 60:
            return None
        if time.time() - auth_date > 86400:
            return None

        check_string = "\n".join(
            f"{key}={value}" for key, value in sorted(parsed.items())
        )

        secret = hmac.new(
            b"WebAppData",
            bot_token.encode(),
            hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            secret,
            check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            return None

        user = json.loads(parsed.get("user", "{}"))

        if not isinstance(user, dict) or not user.get("id"):
            return None

        return user

    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def supabase_request(url, key, method, body=None):
    data = None

    if body is not None:
        data = json.dumps(body).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
        }
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        return response.status


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        bot_token = os.environ.get("BOT_TOKEN")
        supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        supabase_key = (
            os.environ.get("SUPABASE_KEY")
            or os.environ.get("SUPABASE_SECRET_KEY")
            or ""
        )

        if not bot_token or not supabase_url or not supabase_key:
            return send_json(
                self, 500,
                {"ok": False, "message": "Сервер не настроен"}
            )

        try:
            length = int(self.headers.get("Content-Length", "0"))

            if length <= 0 or length > 12000:
                return send_json(
                    self, 413,
                    {"ok": False, "message": "Некорректный размер запроса"}
                )

            payload = json.loads(self.rfile.read(length))

            if not isinstance(payload, dict):
                return send_json(
                    self, 400,
                    {"ok": False, "message": "Некорректные данные"}
                )

            user = verify_init_data(
                payload.get("initData", ""),
                bot_token
            )

            if not user:
                return send_json(
                    self, 401,
                    {"ok": False,
                     "message": "Открой FLOWLY через Telegram"}
                )

            allowed_ids = (
                "notifyLesson",
                "notifyBreak",
                "notifyMorning",
                "notifyEvening"
            )

            settings = payload.get("notifications")

            if not isinstance(settings, dict):
                return send_json(
                    self, 400,
                    {"ok": False,
                     "message": "Настройки уведомлений не найдены"}
                )

            if any(
                key not in allowed_ids
                or not isinstance(value, bool)
                for key, value in settings.items()
            ):
                return send_json(
                    self, 400,
                    {"ok": False,
                     "message": "Некорректные настройки уведомлений"}
                )

            normalized = {
                key: settings.get(key, False)
                for key in allowed_ids
            }

            schedule = payload.get("schedule", {})

            if not isinstance(schedule, dict):
                return send_json(
                    self, 400,
                    {"ok": False, "message": "Некорректное расписание"}
                )

            row = {
                "telegram_user_id": int(user["id"]),
                "notification_settings": normalized,
                "schedule_settings": schedule,
                "updated_at": time.strftime(
                    "%Y-%m-%dT%H:%M:%SZ", time.gmtime()
                )
            }

            supabase_request(
                f"{supabase_url}/rest/v1/flowly_notification_settings"
                "?on_conflict=telegram_user_id",
                supabase_key,
                "POST",
                row
            )

            return send_json(
                self, 200,
                {"ok": True, "message": "Настройки сохранены"}
            )

        except (ValueError, json.JSONDecodeError):
            return send_json(
                self, 400,
                {"ok": False, "message": "Некорректные данные"}
            )

        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            print(
                f"Supabase HTTP error {error.code}: {details}",
                flush=True
            )
            return send_json(
                self, 502,
                {"ok": False, "message": "Ошибка ответа Supabase"}
            )

        except Exception as error:
            print(
                f"notifications.py error: "
                f"{type(error).__name__}: {error}",
                flush=True
            )
            return send_json(
                self, 502,
                {"ok": False,
                 "message": "Не удалось сохранить настройки"}
            )

            excepturllib.error.HTTPErroraserror:
            details = error.read().decode("utf-8", errors="replace")
            print(
                f"Supabase HTTP error {error.code}: {details}",
                flush=True
            )
            return send_json(
                self, 502,
                {"ok": False, "message": "Ошибка ответа Supabase"}
            )

        except Exception as error:
            print(
                f"notifications.py error: "
                f"{type(error).__name__}: {error}",
                flush=True
            )
            return send_json(
                self, 502,
                {"ok": False,
                 "message": "Не удалось сохранить настройки"}
            )

    def do_GET(self):
        return send_json(
            self, 405,
            {"ok": False, "message": "Используй POST"}
        )

    def log_message(self, format, *args):
        pass
