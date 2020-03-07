const BlocksToMarkdown = require("@sanity/block-content-to-markdown");
const groq = require("groq");
const client = require("../utils/sanity.js");
const serializers = require("../utils/serializers");
const overlayDrafts = require("../utils/overlayDrafts");
const hasToken = !!client.config().token;

function generatePost(post) {
  return {
    ...post,
    body: BlocksToMarkdown(post.body, { serializers, ...client.config() }),
    excerpt: BlocksToMarkdown(post.excerpt, { serializers, ...client.config() })
  };
}

async function getPosts() {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "post" && defined(slug) && publishedAt < now()]`;
  const projection = groq`{
    _id,
    publishedAt,
    title,
    slug,
    body[]{
      ...,
      children[]{
        ...,
      }
    },
    excerpt[]{
      ...,
      children[]{
        ...,
      }
    },
  }`;

  const order = `| order(publishedAt asc)`;
  const query = [filter, projection, order].join(" ");
  const docs = await client.fetch(query).catch(err => console.error(err));
  const reducedDocs = overlayDrafts(hasToken, docs);
  const preparePosts = reducedDocs.map(generatePost);

  return preparePosts;
}

module.exports = getPosts;