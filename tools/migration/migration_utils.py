#!/usr/bin/env python3

"""
Author: Emil Eriksson (E18) <eje1999@gmail.com>
"""

import requests as req
from http.cookies import BaseCookie

# Some ANSI color codes for terminal
ANSI_CLEAR_ALL = "\033[0m"
ANSI_BOLD = "\033[1m"
ANSI_RED = "\033[31m"


def make_bold_red(s: str) -> str:
    """
    Lägger till ANSI-codes för att göra text fetstukt röd
    """

    return ANSI_BOLD + ANSI_RED + s + ANSI_CLEAR_ALL

def print_warning(msg: str, warning="WARNING") -> None:
    print(f"{make_bold_red(warning)}: {msg}", flush=True)

def get_ekorre_auth_tokens(base_api_url: str, username: str, password: str) -> req.cookies.RequestsCookieJar:
    """
    Loggar in i `ekorre` med username och password, och returnerar en cookie jar som innehåller
    en refresh token och en access token att användas i vidare requests som kräver auth.
    """

    LOGIN_QUERY = """
      mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          username
        }
    }
    """

    res = req.post(base_api_url, json={
        "query": LOGIN_QUERY,
        "variables": {
            "username": username,
            "password": password
        }
    })

    # requests leker inte snällt med localhost...
    # Så vi måste ladda in kakors rådata, och sen skapa
    # nya som gäller för alla domäner
    cookie_jar = req.cookies.RequestsCookieJar()
    bc = BaseCookie()
    bc.load(res.headers['Set-Cookie'])

    for cookie in bc.items():
        cookie_jar.set(cookie[1].key, cookie[1].value)
    
    return cookie_jar

def upload_file_to_ekorre(base_api_url: str, cookie_jar: req.cookies.RequestsCookieJar, file_path: str, upload_path="/") -> str:
    """
    Laddar upp en fil till `ekorre` på definierad `path`, och returnerar `file_id`.
    
    Parameters
    ----------
    base_api_url : str
        Bas-URL till ekorre-API:n
    cookie_jar : req.cookies.RequestsCookieJar
        cookie jar med auth till `ekorre`. Fås av `migration_utils.get_ekorre_auth_tokens()`
    file_path : str
        Var filen som ska laddas upp hittas lokalt
    upload_path : str, default=\"/\"
        Vart filen ska laddas upp på filservern

    Returns
    -------
    file_id : str
        Filens ID på servern
    """

    body = {
        "path": upload_path
    }

    with open(file_path, "rb") as f:
        file_res = req.post(
            f"{base_api_url}/files/upload", data=body, files={'file': f.read()}, cookies=cookie_jar)
    
    if file_res.status_code != 200:
        print_warning(f"Got status code {file_res.status_code} when trying to upload {file_path}")

    return file_res.json()["id"]

if __name__ == "__main__":
    print("Detta skript innehåller utils, och ska ej köras direkt. Importera där det passar.")
