#
#  Copyright 2017 Telefónica Digital España S.L.
#  
#  This file is part of UrboCore API.
#  
#  UrboCore API is free software: you can redistribute it and/or
#  modify it under the terms of the GNU Affero General Public License as
#  published by the Free Software Foundation, either version 3 of the
#  License, or (at your option) any later version.
#  
#  UrboCore API is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
#  General Public License for more details.
#  
#  You should have received a copy of the GNU Affero General Public License
#  along with UrboCore API. If not, see http://www.gnu.org/licenses/.
#  
#  For those usages not covered by this license please contact with
#  iot_support at tid dot es
#

if [[ $# -eq 0 ]] || [[ "${@: -1}" == --* ]]; then
  echo "Usage:";
  echo "$0 --uploads3 <scope> "
  exit;
fi

for i in "$@"
do
case $i in
    --uploads3)
    UPLOADS3=true
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

SCOPE=${@: -1}
echo ${SCOPE}
# echo "${@: -1}"
ssh ubuntu@walter.geographica.io docker exec -i urbo_pgsql pg_dump -U postgres -d urbo -n ${SCOPE} >${SCOPE}.sql
tar czf ${SCOPE}.sql.tar.gz ${SCOPE}.sql

if [[ ${UPLOADS3} == true ]]; then
  aws --profile s3_sandbox s3 cp ${SCOPE}.sql.tar.gz s3://sandbox.geographica.gs/
  rm ${SCOPE}.*
else
  rm ${SCOPE}.sql
fi
