import type { BlogPost } from '@/types/blog-post';
import amkVsYliopisto from '@/content/blog/amk-vs-yliopisto-haalarivarit-eroilla.json';
import drophostJaaTiedostoja from '@/content/blog/drophost-jaa-tiedostoja.json';
import haalaritSaannot from '@/content/blog/haalarit-saannot-4-saantoa.json';
import kaikkiHaalarivarit from '@/content/blog/kaikki-suomen-yliopistojen-haalarivarit-2024.json';
import koodaripulaItTaidot from '@/content/blog/koodaripula-it-taidot.json';
import mitenHaalarivarit from '@/content/blog/miten-haalarivarit-valitaan-opiskelijakulttuurin-perusteet.json';
import opiskelijakulttuurinHistoria from '@/content/blog/opiskelijakulttuurin-historia-suomessa.json';

export const RAW_BLOG_POSTS: BlogPost[] = [
  amkVsYliopisto,
  drophostJaaTiedostoja,
  haalaritSaannot,
  kaikkiHaalarivarit,
  koodaripulaItTaidot,
  mitenHaalarivarit,
  opiskelijakulttuurinHistoria,
] as BlogPost[];
