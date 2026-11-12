import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
 code:text('code').primaryKey(),keyHash:text('key_hash').notNull(),controllerKey:text('controller_key').notNull(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),lastCommand:text('last_command'),
});
export const events=sqliteTable('events',{
 id:integer('id').primaryKey({autoIncrement:true}),room:text('room').notNull(),commandId:text('command_id').notNull(),revision:integer('revision').notNull(),
 time:text('time').notNull(),event:text('event').notNull(),details:text('details').notNull(),
},t=>[uniqueIndex('events_command').on(t.room,t.commandId),index('events_room').on(t.room,t.id)]);
