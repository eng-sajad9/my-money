$content = [System.IO.File]::ReadAllText('.\temp.js', [System.Text.Encoding]::UTF8)

$pattern = '(?s)// .*?function queueForSync\(action, data\).*?async function saveState\(\).*?saveStateRemote\(\);\r?\n\s+if \(!success\) \{.*?\r?\n\s+\}\r?\n\s+\}'
$replacement = "    async function saveState() {`r`n      // update modification timestamp whenever we save`r`n      state.lastModified = Date.now();`r`n      saveStateLocal();`r`n      `r`n      await saveStateRemote();`r`n    }"

$content = $content -replace $pattern, $replacement
[System.IO.File]::WriteAllText('.\temp.js', $content, [System.Text.Encoding]::UTF8)
