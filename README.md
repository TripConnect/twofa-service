# Introduction
The backend service for two-factor authentication

# Snippets
How access postgres shell  
```sh
psql -U service -d twofa-service # access to postgres shell
\dt # view all tables
```
Common usage queries  
```sql
SELECT * FROM totp_factor_settings;
```