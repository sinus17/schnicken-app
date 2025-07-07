#!/bin/bash

# Using the Supabase connection details and service role key from user's rules
psql "postgresql://postgres.sfeckdcnlczdtvwpdxer:datenbankpasswort@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f create_rpc_function.sql
