affected_apps=$(npm run affected:apps -- --plain 2>&1 | (head -n1 && tail -n1))

echo $affected_apps;
