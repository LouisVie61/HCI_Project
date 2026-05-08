# Run the app with these instructions below

## Run backend

Use docker - connecting between db and app

```bash
docker compose up -d
```

Check:

```bash
docker ls
```
If you've experienced with postgre before or you've had a postgres-desktop:
- Check: the inbound (machine port): outbout (virtual port in docker)

Then:

```bash
cd backend\app
```

create: virtual environment:
```bash
python -m venv venv
```

then activate your venv:
```bash
venv\Scripts\activate
```

In the next stage:
```bash
pip install -r .\requirement.txt
```

At this stage, you can start coding

## Run frontend

First, changing your directory:

```bash
cd \frontend
```

then install
```bash
npm install
```

last, when you finish, run this
```bash
npm run dev
```

You can start coding FE from here
