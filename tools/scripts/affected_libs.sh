affected_libs=$(npm run affected:libs -- --plain 2>&1 | (head -n1 && tail -n1))

echo $affected_libs;
