ARG ELASTIC_VERSION
ARG ELASTICSEARCH_HOST
ARG ELASTICSEARCH_SERVICE_ACCOUNT_TOKEN
ARG ELASTIC_SECURITY
ARG ELASTIC_SSL

FROM python:3.13

ENV PYTHONNUNBEFFERD=1
ENV PYTHONWRITEBYTECODE=1

RUN apt-get update \
    # dependencies for building Python packeges
    && apt-get install -y build-essential \
    # Additional dependencies
        telnet \
        netcat-openbsd \
    # cleaning up unused files
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

# Requirements are installed here to ensure they will be cached
COPY ./requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

# RUN sed -i 's/\r$//g' /entrypoint is used to process the line endings 
# of the shell scripts, which converts Windows line endings to UNIX line endings.
COPY ./scripts/backend/entrypoint /entrypoint
RUN sed -i 's/\r$//g' /entrypoint
RUN chmod +x /entrypoint

COPY ./scripts/backend/start /start
RUN sed -i 's/\r$//g' /start
RUN chmod +x /start

COPY ./scripts/celery/worker/start /start-celeryworker
RUN sed -i 's/\r$//g' /start-celeryworker
RUN chmod +x /start-celeryworker

COPY ./scripts/celery/beat/start /start-celerybeat
RUN sed -i 's/\r$//g' /start-celerybeat
RUN chmod +x /start-celerybeat

WORKDIR /app

ENTRYPOINT ["/entrypoint"]