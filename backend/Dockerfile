# Use Python 3.11 as the base image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for mysqlclient
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       pkg-config \
       default-libmysqlclient-dev \
       build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project code
COPY . /app/

# Collect static files for WhiteNoise
RUN python manage.py collectstatic --noinput

RUN chmod +x entrypoint.sh

EXPOSE 8000

# Run migrations, then Gunicorn
CMD ["./entrypoint.sh"]