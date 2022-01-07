#!/usr/bin/env python3

"""
Author: Emil Eriksson (E18) <eje1999@gmail.com>
Usage: mh_migration.py <hehe dir> <API URL>

Detta skriptet är till för att migrera samtliga nummer av HeHE från det
gamla systemet och lägga in det via requests till API:n för det nya systemet. Det
förlitar sig på att strukturen för dessa filer är förvånadsvärt konsekvent,
och har formen (här är alla former på filnamn).

papers/
├── 1996-7.pdf
├── 2008-18.pdf
├── ...
└── 2021-4.pdf

Samtliga HeHE finns i skrivande stund att hitta i /srv/eee.esek.se/public_html/data/hehe/papers/
på hacke.
"""

import getpass
import os
import re
import sys
from dataclasses import dataclass
from typing import List

import requests as req

from migration_utils import get_ekorre_auth_tokens, print_warning


@dataclass
class Hehe:
    number: int
    year: int

    def __eq__(self, other: object) -> bool:
        if (self.__class__ != other.__class__):
            return False
        else:
            return self.number == other.number and self.year == other.number

    def __str__(self) -> str:
        return f"{self.year}-{self.number}"


def parse_papers_dir(papers_dir: str) -> List[Hehe]:
    res = []
    for filename in os.listdir(papers_dir):
        search_res = re.search(r"(\d)-(\d).pdf", filename)
        if not search_res:
            print_warning(f"Could not parse file {filename}, considering uploading manually!")
        else:
            new_hehe = Hehe(number=int(search_res.group(2)),
                            year=int(search_res.group(1)))
            if new_hehe in res:
                print_warning(f"Duplicate file found! Check {str(new_hehe)}!")
            else:
                res.append(new_hehe)
    return res


def upload_papers(papers: List[Hehe]) -> None:
    base_api_url = sys.argv[2]

    #username = input("Username: ")
    #password = getpass.getpass(prompt="Password: ")

    username = "aa0000bb-s"
    password = "test"

    cookie_jar = get_ekorre_auth_tokens(base_api_url, username, password)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise ValueError("Did not provide input directory and API url")

    papers_dir = sys.argv[1]
    if not os.path.isdir(papers_dir):
        raise ValueError("Not proper input dir, should be papers")

    papers = parse_papers_dir(papers_dir)
    upload_papers(papers)
