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


if __name__ == "__main__":
    print("Detta skript innehåller utils, och ska ej köras direkt. Importera där det passar.")
