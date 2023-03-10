import Vue from 'vue';
import VueApollo from 'vue-apollo';
import createDefaultClient from '~/lib/graphql';

Vue.use(VueApollo);

export const mergeVariables = (existing, incoming) => {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return incoming;
};

export const apolloProvider = new VueApollo({
  defaultClient: createDefaultClient(
    {},
    {
      batchMax: 1,
      cacheConfig: {
        typePolicies: {
          ContainerRepositoryDetails: {
            fields: {
              tags: {
                keyArgs: ['id'],
                merge: mergeVariables,
              },
            },
          },
        },
      },
    },
  ),
});
