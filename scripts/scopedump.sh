#!/bin/bash

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
