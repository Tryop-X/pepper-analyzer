import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import {APIPromise} from "openai/core";
import {ChatCompletion} from "openai/resources";

Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private openai: OpenAI;
  private pimientosResponseSchema = z.object({
    peppers: z.array(
      z.object({
        id: z.union([z.string(), z.number()]),
        color: z.number(),
        tamanoForma: z.number(),
        ausenciaDefectos: z.number(),
        texturaFirmeza: z.number(),
        estadoPedunculo: z.number(),
        uniformidad: z.number(),
        observaciones: z.string()
      }),
      z.object({
        summaryObs: z.string()
      })
    ),
  });

  constructor() {
    this.openai = new OpenAI({
      apiKey: '',  // Reemplaza con tu API Key
      dangerouslyAllowBrowser: true
    });
  }

  analyzePimientos(pimientos: string[], apiKey: string): APIPromise<ChatCompletion> {
    this.openai.apiKey = apiKey;
    const contentMessage: any[] = this.getImageUrls(pimientos)
    contentMessage.unshift(
      { type: "text", text: "Analiza las imágenes de los pimentones y devuelve un número según la calidad del pimentón, siendo 1 malo y 5 bueno" }
    )
    //
    return this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: 'Eres un experto en producción y exportación de pimentones' },
        {
          role: "user",
          content: contentMessage
        },
      ],
      response_format: zodResponseFormat(this.pimientosResponseSchema, 'pimientos-response'),
    });

  }

  getImageUrls(pimientos: string[]) {
    const something = pimientos.map( pepper => {
      console.log(pepper, 'pepperpepperpepper')
      return {
        type: 'image_url',
        image_url: {
          url: pepper,
        },
      }
    });
    return something;
  }
}
