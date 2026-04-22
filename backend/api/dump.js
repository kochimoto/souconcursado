module.exports = async (req, res) => {
  const diagnostic = {
    step: 'start',
    env: {
      has_db_url: !!process.env.DATABASE_URL,
      node_version: process.version,
      vercel_region: process.env.VERCEL_REGION || 'local'
    }
  };

  try {
    diagnostic.step = 'loading_express';
    const express = require('express');
    diagnostic.express_status = 'loaded';

    diagnostic.step = 'loading_prisma';
    const { PrismaClient } = require('@prisma/client');
    diagnostic.prisma_module = 'loaded';

    diagnostic.step = 'initializing_prisma';
    const prisma = new PrismaClient();
    diagnostic.prisma_instance = 'created';

    diagnostic.step = 'loading_main_app';
    const app = require('../src/index');
    diagnostic.app_status = 'loaded';

    res.status(200).json({
      success: true,
      message: 'Todos os módulos foram carregados com sucesso no modo nativo.',
      diagnostic
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      error_message: err.message,
      error_stack: err.stack,
      failed_step: diagnostic.step,
      diagnostic
    });
  }
};
