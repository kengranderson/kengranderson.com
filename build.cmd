@echo off

IF EXIST work RD /s /q work
MD work

FOR %%d in (capri-service-manual css fonts images js lib media share photos) DO XCOPY kengranderson\%%d work\%%d\*.* /F /E
FOR %%f in (favicon.ico highlights.json index.html) DO XCOPY kengranderson\%%f work

