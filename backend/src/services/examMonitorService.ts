// @ts-nocheck
import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../utils/prisma';

export const syncExamsFromPCI = async () => {
  const url = 'https://www.pciconcursos.com.br/concursos/';
  
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    const exams: any[] = [];

    // PCI Concursos estrutura os concursos em divs ou tabelas dependendo da seção
    // Vamos focar no conteúdo principal
    $('.ca').each((_, element) => {
      const parent = $(element).parent();
      const title = $(element).find('a').text().trim();
      const link = $(element).find('a').attr('href');
      
      // Extrair metadados (geralmente texto após o link)
      const metaText = parent.text().replace(title, '').trim();
      
      // Tentar extrair vagas e nível do texto (exemplo simplificado)
      const vacanciesMatch = metaText.match(/(\d+)\s+vagas/i);
      const levelMatch = metaText.match(/(Superior|Médio|Fundamental)/i);

      if (title && link) {
        exams.push({
          name: title,
          organization: title.split('-')[0].trim(),
          vagas: vacanciesMatch ? parseInt(vacanciesMatch[1]) : 0,
          level: levelMatch ? levelMatch[0] : 'Não especificado',
          status: 'Aberto',
          link: link.startsWith('http') ? link : `https://www.pciconcursos.com.br${link}`,
          area: 'Geral', // Pode ser refinado
          state: 'Nacional' // TODO: Extrair o estado corretamente
        });
      }
    });

    console.log(`Encontrados ${exams.length} concursos. Sincronizando...`);

    // UPSERT no banco de dados
    for (const examData of exams) {
      await prisma.exam.upsert({
        where: { name: examData.name }, // Nome como único para simplificar sync
        update: {
          vagas: examData.vagas,
          status: examData.status,
          link: examData.link
        },
        create: {
          name: examData.name,
          organization: examData.organization,
          vagas: examData.vagas,
          level: examData.level,
          status: examData.status,
          area: examData.area,
          state: examData.state,
          link: examData.link
        }
      });
    }

    return { count: exams.length };
  } catch (error) {
    console.error('Erro ao sincronizar concursos:', error);
    throw error;
  }
};
