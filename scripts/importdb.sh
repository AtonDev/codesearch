#!/bin/bash
heroku pgbackups:capture --remote production
curl -o latest.dump `heroku pgbackups:url --remote production`
pg_restore --verbose --clean --no-acl --no-owner -h localhost -U APG2 -d codesearch latest.dump
rm latest.dump
