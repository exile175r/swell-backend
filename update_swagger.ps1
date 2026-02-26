$files = @("d:\document\project\Swell\frontend\swagger_init_utf8.js", "d:\document\project\Swell\frontend\swagger_init.js")

foreach ($path in $files) {
    if (Test-Path $path) {
        $lines = Get-Content $path
        # Line 16: Description update
        $lines[15] = '      "description": "Swell 애플리케이션의 백엔드 API 문서입니다."'
        # Line 36: Summary update
        $lines[35] = '          "summary": "실시간 STT 엔진 연동 음성 변환 (REST API)",'
        # Line 42: Description update (Responses)
        $lines[41] = '              "description": "STT 엔진 준비 및 변환 프로세스 시작"'
        $lines | Set-Content $path -Encoding utf8
    }
}
