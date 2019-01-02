#!/bin/bash

ii="05"
for j in `seq 18 23`;
do
  if [ "${j}" -lt "10" ];
  then
    jj="0${j}"
  else
    jj="${j}"
  fi

  echo "########## EXECUTING 2018-02-${ii}T${jj}:00:00Z"
  echo "######### AT `date`"
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_propagate('aljarafe', '2018-02-${ii}T${jj}:00:00Z', 60);"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_agg_realtime_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z');"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_agg_forecast_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z', TRUE);"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_leak_detection_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z');"
  sleep 1
  echo "#########################################"
done

ii="06"
for j in `seq 0 14`;
do
  if [ "${j}" -lt "10" ];
  then
    jj="0${j}"
  else
    jj="${j}"
  fi

  echo "########## EXECUTING 2018-02-${ii}T${jj}:00:00Z"
  echo "######### AT `date`"
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_propagate('aljarafe', '2018-02-${ii}T${jj}:00:00Z', 60);"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_agg_realtime_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z');"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_agg_forecast_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z', TRUE);"
  sleep 1
  docker exec -ti urbo_pgsql psql -U urbo_admin -d urbo -c "SELECT urbo_aq_cons_leak_detection_hourly('aljarafe', '2018-02-${ii}T${jj}:00:00Z');"
  sleep 1
  echo "#########################################"
done

