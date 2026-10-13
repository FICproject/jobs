@echo off
echo ==============================================
echo Building Candidate App APK (CandidateApp)...
echo ==============================================
cd /d "%~dp0candidate_mobile\android"
call gradlew assembleRelease
if %ERRORLEVEL% EQU 0 (
    copy /y "%~dp0candidate_mobile\android\app\build\outputs\apk\release\app-release.apk" "%~dp0CandidateApp.apk"
    echo.
    echo ==============================================
    echo [SUCCESS] New Candidate APK is ready at:
    echo %~dp0CandidateApp.apk
    echo ==============================================
) else (
    echo.
    echo [ERROR] Build failed.
)
pause
