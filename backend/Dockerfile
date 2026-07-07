# storefront/Dockerfile

# Use Python 3.11 as the base image
FROM python:3.11-slim

# Set environment variables for optimized Python execution
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies required for MySQL client (if using mysqlclient)
RUN apt-get update \
    && apt-get install -y default-libmysqlclient-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project code
COPY . /app/

# Expose the application port
EXPOSE 8000

# Run Gunicorn with a sensible default of 3 workers
CMD ["gunicorn", "storefront.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]