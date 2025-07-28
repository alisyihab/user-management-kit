import * as winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";
import * as DailyRotateFile from "winston-daily-rotate-file";
import { v4 as uuidv4 } from "uuid";

const esTransport = new ElasticsearchTransport({
  level: "info",
  indexPrefix: "app-logs",
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    auth: {
      username: process.env.ES_USERNAME || "elastic",
      password: process.env.ES_PASSWORD || "changeme",
    },
    tls: {
      rejectUnauthorized: false,
    },
  },
  transformer: (logData: any) => ({
    "@timestamp": new Date().toISOString(),
    message: logData.message,
    log: { level: logData.level },
    trace: { id: logData.requestId || uuidv4() },
    ...logData.meta,
  }),
});

const fileTransport = new DailyRotateFile({
  filename: `logs/app-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});


export const winstonTransports = [
  new winston.transports.Console(),
  fileTransport,
  esTransport,
];
