import { defineType, defineField } from 'sanity'

export const processedDocument = defineType({
  name: 'processedDocument', 
  title: 'Processed Document',
  type: 'document',
  fields: [
    defineField({ name: 'id', title: 'ID', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text' }),
    defineField({ name: 'summary', title: 'Summary', type: 'text' }),
  ],
})
