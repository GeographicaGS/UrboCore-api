#!/usr/bin/env python3

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
