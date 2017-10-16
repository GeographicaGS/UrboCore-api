#!/usr/bin/env python3
# 
# Copyright 2017 Telefónica Digital España S.L.
# 
# This file is part of UrboCore API.
# 
# UrboCore API is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# UrboCore API is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
# General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with UrboCore API. If not, see http://www.gnu.org/licenses/.
# 
# For those usages not covered by this license please contact with
# iot_support at tid dot es
# 

from datetime import datetime, timedelta
import gzip
import os
import re
import time

LOGS_DIR = '/data/app/urbo/urbo-logs'
FILE_PATTERN = '^[\-\w]+\.log\.[\-\w]+[^\.gz]'
COMPRESS_SUFFIX = '.gz'
DAYS_TO_LIVE = 31

pattern = re.compile(FILE_PATTERN + '$')
for f in [os.path.join(LOGS_DIR, f) for f in os.listdir(LOGS_DIR) if pattern.match(f)]:
  f_in = f
  f_out = f + COMPRESS_SUFFIX

  with open(f_in, 'rb') as f_in, gzip.open(f_out, 'wb') as f_out:
    f_out.writelines(f_in)

  os.remove(f)

pattern = re.compile(FILE_PATTERN + '\\' +  COMPRESS_SUFFIX + '$')
for f in [os.path.join(LOGS_DIR, f) for f in os.listdir(LOGS_DIR) if pattern.match(f)]:
  f_date = os.stat(os.path.join(LOGS_DIR, f)).st_mtime

  the_past = datetime.today() - timedelta(days=DAYS_TO_LIVE)
  the_past = time.mktime(the_past.timetuple())

  if (f_date <= the_past):
    os.remove(f)
