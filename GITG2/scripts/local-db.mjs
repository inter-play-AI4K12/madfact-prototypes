import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readdirSync,readFileSync} from 'node:fs';
export function localDB(filename='.data/gitg2.sqlite'){
 if(filename!==':memory:')mkdirSync('.data',{recursive:true});const sqlite=new DatabaseSync(filename);
 sqlite.exec('CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()){if(!sqlite.prepare('SELECT name FROM _local_migrations WHERE name=?').get(file)){sqlite.exec(readFileSync('drizzle/'+file,'utf8'));sqlite.prepare('INSERT INTO _local_migrations VALUES (?)').run(file);}}
 return {sqlite,prepare(sql){return{sql,values:[],bind(...values){this.values=values;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async run(){const out=sqlite.prepare(sql).run(...this.values);return {meta:{changes:out.changes}};}};},async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements){const result=sqlite.prepare(s.sql).run(...s.values);out.push({meta:{changes:result.changes}});}sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
}
