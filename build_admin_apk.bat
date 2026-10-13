@echo off
echo ==============================================
echo Building Admin / HR App APK (AdminRecruitPro)...
echo ==============================================
cd /d "%~dp0admin_mobile\android"
call gradlew assembleRelease
if %ERRORLEVEL% EQU 0 (
    copy /y "%~dp0admin_mobile\android\app\build\outputs\apk\release\app-release.apk" "%~dp0AdminRecruitPro.apk"
    echo.
    echo ==============================================
    echo [SUCCESS] New Admin APK is ready at:
    echo %~dp0AdminRecruitPro.apk
    echo ==============================================
) else (
    echo.
    echo [ERROR] Build failed.
)
pause
