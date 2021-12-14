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

"""
{
  <year>: [
    {
      meeting_type: <"SM" | "HTM" | "VM" | "VTM" | "Extra">,
      document_type: <"summons" | "documents" | "lateDocuments" | "protocol" | "appendix">,
      number: <Int>
    },
    # ...
  ],
  # ...
}
"""
meetings = {}


def append_file(filename: str, year: str) -> None:
    # Hitta typ av möte med regex
    meeting_type_match = re.search(
        r"(ht|s|vm|vt|smextra)(?:\d{1,2})?-.*\.pdf", filename).group(0)

    if meeting_type_match == "ht":
        meeting_type = "HTM"
        number = -1
    elif meeting_type_match == "s":
        meeting_type = "SM"
        number = int(
            re.search(r"s(\d{1,2})-\d{,2}-.*\.pdf", filename).group(0))
    elif meeting_type_match == "vm":
        meeting_type = "VM"
        number = -1
    elif meeting_type_match == "vt":
        meeting_type = "VTM"
        number = -1
    elif meeting_type_match == "smextra":
        meeting_type = "Extra"
        number = int(
            re.search(r"smextra(\d{1,2})-\d{,2}-.*\.pdf", filename).group(0))
    else:
        print(f"AAAH okänd mötestyp för år {year}: {filename}!")
        sys.exit(1)

    document_type_match = re.search(
        r".*-(kallelse|handlingar|sena handlingar|protokoll|bilaga)", filename).group(0)

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

    if year not in meetings.keys:
        meetings[year] = []
    
    meetings[year].append({
      "meeting_type": meeting_type,
      "document_type": document_type,
      "number": number,
    })


def migrate_to_ekorre():
    username = input("Username: ")
    password = input("Password: ")


if __name__ == "__main__":
    # Vi antar att första argumentet passed är ett dir med alla år (`moteshandlingar`)
    if len(sys.argv) < 3:
        raise ValueError("Did not provide input directory and API url")

    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        raise ValueError("Not proper input dir, should be moteshandlingar")

    for year_dir in os.listdir(root_dir):
        print(f"Parsing filenames for ")
        for filename in year_dir:
            append_file(filaname, year_dir)
    
    print(meetings)
    #migrate_to_ekorre()
