FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scraping_site_web_mina7.py .


CMD ["python", "scraping_site_web_mina7.py"]
