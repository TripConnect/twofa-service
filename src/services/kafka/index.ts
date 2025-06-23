import { Kafka, logLevel as KafkaLogLevel } from "kafkajs";
import { ConfigHelper } from "common-utils";

export default new Kafka({
    clientId: 'twofa-service',
    brokers: [`${ConfigHelper.read("kafka.host")}:${ConfigHelper.read("kafka.port")}`],
    logLevel: KafkaLogLevel.ERROR
});
