# Africa's Talking USSD em ambiente local

## Objectivo
Expor o callback local do backend WIRA para a internet e configurá-lo na Africa's Talking.

## Endpoint do callback
O backend responde em:

```text
/api/ussd
```

Em local, o callback final precisa de ser público. Exemplo:

```text
https://abc123.ngrok-free.app/api/ussd
```

## 1. Configurar o backend
Copie `backend/.env.example` para `backend/.env` e preencha:

```env
NODE_ENV=development
PORT=3000
USSD_SHORTCODE=*384*36224#
AT_USSD_CALLBACK_URL=https://abc123.ngrok-free.app/api/ussd
ENABLE_USSD_AUX_ENDPOINTS=true
SMS_PROVIDER=africastalking
SMS_USERNAME=<your_africas_talking_username>
SMS_API_KEY=<your_africas_talking_api_key>
SMS_SENDER=WIRA
```

## 2. Subir o backend

```powershell
cd backend
npm.cmd run dev
```

## 3. Abrir um túnel público
Exemplo com `ngrok`:

```powershell
ngrok http 3000
```

Se o `ngrok` mostrar:

```text
Forwarding https://abc123.ngrok-free.app -> http://localhost:3000
```

então o callback URL é:

```text
https://abc123.ngrok-free.app/api/ussd
```

## 4. Configurar na Africa's Talking
No produto USSD da Africa's Talking:

- Shortcode: o teu shortcode real
- Callback URL: `https://<public-tunnel>/api/ussd`

## 5. Testar localmente como a Africa's Talking
O backend aceita `application/x-www-form-urlencoded`.

Script PowerShell:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\test-ussd-at.ps1
```

Primeira resposta esperada:

```text
CON WIRA

Bem-vinda ao WIRA.

Informe o seu codigo de acesso (ex.: V0042):
```

Teste com código:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-ussd-at.ps1 -SessionId local-session-1 -Text V0042
```

## 6. Verificar estado do serviço

```powershell
Invoke-RestMethod http://localhost:3000/api/ussd/status
```

## Notas
- `localhost` nunca deve ser usado directamente como callback na Africa's Talking.
- Se mudares o túnel, actualiza `AT_USSD_CALLBACK_URL` e o painel da Africa's Talking.
- O endpoint `POST /api/ussd/test` continua disponível para o simulador local e devolve JSON.
