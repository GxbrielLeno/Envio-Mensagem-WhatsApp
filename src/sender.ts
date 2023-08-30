import { create, Whatsapp } from "venom-bot";
import fs from "fs";
import csvParser from "csv-parser";
import { format } from "date-fns";

const dataAtual: Date = new Date();
const formatoDesejado: string = "dd/MM/yyyy HH:mm:ss";
const dataAtualFormatada: string = format(dataAtual, formatoDesejado);

class Sender {
  private client: Whatsapp;
  private numbersDatabase: {
    number: string;
    name: string;
    mesBoleto: string;
  }[];

  constructor() {
    this.numbersDatabase = [];
    this.loadCSVData();
    this.initialize();
  }

  async sendText(to: string, body: string) {
    try {
      await this.client.sendText(to, body);
      this.saveSucessToFile(to);
    } catch (error) {
      this.saveErrorToFile(error, to);
    }
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private loadCSVData() {
    const csvFilePath = "src/db/dados.csv"; // Caminho completo para o arquivo CSV

    console.log("Tentando abrir o arquivo:", csvFilePath);

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (row) => {
        this.numbersDatabase.push({
          number: row.telefonewhatsapp,
          name: row.nome,
          mesBoleto: row.boleto,
        });
      })
      .on("end", () => {
        console.log("Dados do CSV carregados com sucesso.");
      });
  }

  private async initialize() {
    const qr = (base64Qrimg: string) => {
      console.log(base64Qrimg);
    };

    const status = (statusSession: string) => {};

    const start = async (client: Whatsapp) => {
      this.client = client;

      for (const contact of this.numbersDatabase) {
        await this.delay(5000);
        this.sendText(
          `${contact.number}@c.us`,
          `
Caro(a) ${contact.name},

Seu boleto referente ao mês de *${contact.mesBoleto}* consta em *aberto* para nós!
Você pode pagar ele vencido. Para mantermos seu benefício neste mês,
cobraremos apenas a pontualidade e a correção monetária, se forem
pagos até *31/08/2023.*

Se já efetuou o pagamento, por gentileza enviar o comprovante junto com
o número de sua matrícula, ou CPF, para o WhatsApp do setor Financeiro
– (XX) XXXXX-XXXX.

Cordialmente,
XXXXXX XXXX.
          `
        );
      }
    };

    create("ws-sender-dev", qr, status)
      .then((client) => start(client))
      .catch((error) => console.log(error));
  }

  private saveErrorToFile(error: any, recipient: string) {
    const contact = this.numbersDatabase.find(
      (c) => `${c.number}@c.us` === recipient
    );
    if (contact) {
      const errorMessage = `Não foi possível enviar mensagem para:${contact.name} número: (${recipient}) Registro:${dataAtualFormatada}`;
      fs.appendFile("/Logs/errors.txt", errorMessage, (err) => {
        if (err) {
          console.error("Error saving error to file:", err);
        } else {
          console.log("Uma mensagem foi salva no arquivo de errors.txt");
        }
      });
    }
  }

  private saveSucessToFile(recipient: string) {
    const contact = this.numbersDatabase.find(
      (c) => `${c.number}@c.us` === recipient
    );
    if (contact) {
      const successMessage = `Mensagem enviada para: ${contact.name} número: (${recipient}) Registro:${dataAtualFormatada}`;
      fs.appendFile("/Logs/success.txt", successMessage, (err) => {
        if (err) {
          console.error("Error saving success to file:", err);
        } else {
          console.log("Mensagem salva no arquivo success.txt");
        }
      });
    }
  }
}

export default Sender;
