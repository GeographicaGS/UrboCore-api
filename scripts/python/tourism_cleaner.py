# Completely deprecated

#!/usr/bin/env python3

# coding: utf-8

import argparse
import csv
import datetime
import re

import numpy as np
import pandas as pd

from geopy.geocoders import Nominatim


# Constants
CSV_EXTENSION = '.csv'
FILENAME_SUFFIX = '_fixed'
COUNTRIES = {
    'Espana': 'España',
    'Mexico': 'México',
    'Canada': 'Canadá',
    'Uzbekistan': 'Uzbekistán',
    'Gran Bretana': 'Gran Bretaña',
    'Belgica': 'Bélgica',
    'Peru': 'Perú',
    'Rumania': 'Rumanía',
    'Republica Dominicana': 'República Dominicana',
    'Emiratos arabes Unidos': 'Emiratos Árabes Unidos',
    'Panama': 'Panamá',
    'Djibouti': 'Yibuti'
}


def geocode_names(name):
    geolocator = Nominatim()
    location = geolocator.geocode(name)
    return (location.raw['lat'], location.raw['lon'])


def tourism_cleaner(csv_input_path, csv_output_path):
    df = pd.read_csv(csv_input_path, sep=';')

    # Renaming, creating and droping columns
    df.rename(columns={'geojson': 'position'}, inplace=True)
    df['TimeInstant'] = df.take_time.apply(
        lambda x: datetime.datetime.fromtimestamp(x).isoformat() + 'Z')
    df.drop(['picture_id', 'group_id', 'latitude', 'longitude', 'take_time',
             'year', 'take_time_hour', 'take_time_day_of_week',
             'take_time_month'], axis=1, inplace=True)

    # (Quick) cleaning rows
    for name in df.dtypes.index:
        dtype = df.dtypes[name]

        df = df[df[name] != None]
        if dtype == 'object':  # string
            df = df[df[name] != 'nan']

        else:  # numeric
            df = df[df[name] != np.nan]

    # Removing extra whitespaces
    df.user_city = df.user_city.apply(lambda x: re.sub(' +', ' ', str(x)))
    df.user_zone = df.user_zone.apply(lambda x: re.sub(' +', ' ', str(x)))
    df.user_country = df.user_country.apply(lambda x: re.sub(' +', ' ', str(x)))

    # Fixing country names
    df.user_country = df.user_country.apply(
      lambda x: COUNTRIES[x] if x in COUNTRIES else x)

    # Saving CSV, with commas and quoted strings
    df.to_csv(csv_output_path, index=False, quoting=csv.QUOTE_NONNUMERIC)


# `if __name__ == '__main__':` is for cowards!
parser = argparse.ArgumentParser()
parser.add_argument('input_csv')
args = parser.parse_args()
csv_input_path = args.input_csv
filename_preffix = csv_input_path.split(CSV_EXTENSION)[0]
csv_output_path = filename_preffix + FILENAME_SUFFIX + CSV_EXTENSION
tourism_cleaner(args.input_csv, csv_output_path)
