#!/usr/bin/env python3

"""
Author: Emil Eriksson (E18)
Usage: mh_migration.py <moteshandlingar dir> <API URL>

Detta skriptet är till för att migrera mötesdokument från det gamla systemet,
och lägga in det via requests till API:n till det nya systemet. Det
förlitar sig på att strukturen för dessa filer är förvånadsvärt konsekvent,
och har formen (här är alla former på filnamn)

2021
├── ht-21-handlingar.pdf
├── ht-21-kallelse.pdf
| ...
├── s19-21-handlingar.pdf
├── s19-21-kallelse.pdf
├── s19-21-protokoll.pdf
├── s19-21-sena handlingar.pdf
├── vm-21-handlingar.pdf
├── vm-21-kallelse.pdf
├── smextra1-20-bilaga.pdf
├── smextra1-20-handlingar.pdf
├── smextra1-20-protokoll.pdf
├── smextra1-20-sena handlingar.pdf
├── vm-21-sena handlingar.pdf
├── vt-21-handlingar.pdf
├── vt-21-protokoll.pdf
└── vt-21-sena handlingar.pdf
2020
└── ...
2019
osv...

Vi ignorerar helt enkelt helt databasen och bara laddar upp
alla möteshandlingar själva.
"""

import os
import sys
import re
import getpass
import requests as req
from http.cookies import BaseCookie

"""
{
  <year>: [
    {
      meeting_type: <"SM" | "HTM" | "VM" | "VTM" | "Extra">,
      document_type: <"summons" | "documents" | "lateDocuments" | "protocol" | "appendix">,
      number: <Int>,
      filename: <string>
    },
    # ...
  ],
  # ...
}
"""
meeting_docs = {}


def append_file(filename: str, year: str) -> None:
    # Hitta typ av möte med regex
    try:
        meeting_type_match = re.search(
            r"(ht|s|vm|vt|smextra)(?:\d{1,2})?-.*\.pdf", filename).group(1)
    except:
        print(f"AAAH okänd mötestyp för år {year}: {filename}!")
        sys.exit(1)

    if meeting_type_match == "ht":
        meeting_type = "HTM"
        number = -1
    elif meeting_type_match == "s":
        meeting_type = "SM"
        try:
            number = int(
                re.search(r"s(\d+)(?:-\d+)?-.*\.pdf", filename).group(1))
        except AttributeError:
            print(
                f"AAAAH kunde inte hitta vilket styrelsemöte följande var: {filename}")
            sys.exit(1)
    elif meeting_type_match == "vm":
        meeting_type = "VM"
        number = -1
    elif meeting_type_match == "vt":
        meeting_type = "VTM"
        number = -1
    elif meeting_type_match == "smextra":
        meeting_type = "Extra"
        try:
            number = int(
                re.search(r"smextra(\d{1,2})(?:-\d{,2})?-.*\.pdf", filename).group(1))
        except AttributeError:
            print(
                f"AAAAH kunde inte hitta vilket extramöte följande var: {filename}")
            sys.exit(1)

    document_type_match = re.search(
        r".*-(kallelse|handlingar|sena handlingar|protokoll|bilaga)", filename).group(1)

    if document_type_match == "kallelse":
        document_type = "summons"
    elif document_type_match == "handlingar":
        document_type = "documents"
    elif document_type_match == "sena handlingar":
        document_type = "lateDocuments"
    elif document_type_match == "protokoll":
        document_type = "protocol"
    elif document_type_match == "bilaga":
        document_type = "appendix"
    else:
        print(f"AAAAH okänd dokumenttyp för år {year}: {filename}")
        sys.exit(1)

    if year not in meeting_docs.keys():
        meeting_docs[year] = []

    meeting_docs[year].append({
        "meeting_type": meeting_type,
        "document_type": document_type,
        "number": number,
        "filename": filename,
    })


def migrate_to_ekorre():
    base_api_url = sys.argv[2]
    LOGIN_QUERY = """
      mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          username
        }
    }
    """

    #username = input("Username: ")
    #password = getpass.getpass(prompt="Password: ")

    username = "aa0000bb-s"
    password = "test"

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

    GET_MEETING_ID_QUERY = """
      {
        meeting(id: $id) {
          id
        }
      }
    """

    ADD_MEETING_QUERY = """
      mutation {
        addMeeting(type: $meetingType, number: $number, year: $year)
      }
    """

    ADD_FILE_TO_MEETING_QUERY = """
      mutation {
        addFileToMeeting(meetingId: $meetingId, fileId: $fileId, fileType: $fileType)
      }
    """

    for year in meeting_docs.keys():
        print(f"Uploading files for year {year}")
        for meeting_doc in meeting_docs[year]:
            data = {
                "body": {
                    "path": f"/moteshandlingar/{year}/"
                },
            }
            with open(meeting_doc['filename'], 'rb') as f:
                file_res = req.post(
                    f"{base_api_url}/files/upload", data=data, files={'file': f.read()}, cookies=cookie_jar)
            print(file_res.text)
            sys.exit(0)


if __name__ == "__main__":
    # Vi antar att första argumentet passed är ett dir med alla år (`moteshandlingar`)
    if len(sys.argv) < 3:
        raise ValueError("Did not provide input directory and API url")

    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        raise ValueError("Not proper input dir, should be moteshandlingar")

    for year_dir in os.listdir(root_dir):
        print(f"Parsing filenames for {year_dir}")
        for filename in os.listdir(os.path.join(root_dir, year_dir)):
            append_file(os.path.join(root_dir, year_dir, filename), year_dir)

    migrate_to_ekorre()
