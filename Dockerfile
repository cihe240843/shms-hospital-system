FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq5 postgresql-client
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ /app/
RUN mkdir -p /app/logs /app/staticfiles
EXPOSE 8000
CMD ["gunicorn", "shms.wsgi:application", "--bind", "0.0.0.0:8000"]
