@echo off
cd /d "%~dp0sv"
npx tsx src\scripts\evs.ts %*
