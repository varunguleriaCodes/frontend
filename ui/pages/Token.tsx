import { Skeleton, Box, Icon, Tag } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import type { RoutedTab } from 'ui/shared/RoutedTabs/types';

import iconSuccess from 'icons/status/success.svg';
import useApiQuery from 'lib/api/useApiQuery';
import { useAppContext } from 'lib/appContext';
import useContractTabs from 'lib/hooks/useContractTabs';
import useIsMobile from 'lib/hooks/useIsMobile';
import useQueryWithPages from 'lib/hooks/useQueryWithPages';
import trimTokenSymbol from 'lib/token/trimTokenSymbol';
import * as addressStubs from 'stubs/address';
import * as tokenStubs from 'stubs/token';
import AddressContract from 'ui/address/AddressContract';
import TextAd from 'ui/shared/ad/TextAd';
import PageTitle from 'ui/shared/Page/PageTitle';
import type { Props as PaginationProps } from 'ui/shared/Pagination';
import Pagination from 'ui/shared/Pagination';
import RoutedTabs from 'ui/shared/RoutedTabs/RoutedTabs';
import SkeletonTabs from 'ui/shared/skeletons/SkeletonTabs';
import TokenLogo from 'ui/shared/TokenLogo';
import TokenContractInfo from 'ui/token/TokenContractInfo';
import TokenDetails from 'ui/token/TokenDetails';
import TokenHolders from 'ui/token/TokenHolders/TokenHolders';
import TokenInventory from 'ui/token/TokenInventory';
import TokenTransfer from 'ui/token/TokenTransfer/TokenTransfer';

export type TokenTabs = 'token_transfers' | 'holders' | 'inventory';

const TokenPageContent = () => {
  const router = useRouter();
  const isMobile = useIsMobile();

  const appProps = useAppContext();

  const hasGoBackLink = appProps.referrer && appProps.referrer.includes('/tokens');

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const hashString = router.query.hash?.toString();

  const tokenQuery = useApiQuery('token', {
    pathParams: { hash: hashString },
    queryOptions: { enabled: Boolean(router.query.hash), placeholderData: tokenStubs.TOKEN_INFO_ERC_20 },
  });

  const contractQuery = useApiQuery('address', {
    pathParams: { hash: hashString },
    queryOptions: { enabled: Boolean(router.query.hash), placeholderData: addressStubs.ADDRESS_INFO },
  });

  useEffect(() => {
    if (tokenQuery.data) {
      const tokenSymbol = tokenQuery.data.symbol ? ` (${ tokenQuery.data.symbol })` : '';
      const tokenName = `${ tokenQuery.data.name || 'Unnamed' }${ tokenSymbol }`;
      const title = document.getElementsByTagName('title')[0];
      if (title) {
        title.textContent = title.textContent?.replace(tokenQuery.data.address, tokenName) || title.textContent;
      }
      const description = document.getElementsByName('description')[0] as HTMLMetaElement;
      if (description) {
        description.content = description.content.replace(tokenQuery.data.address, tokenName) || description.content;
      }
    }
  }, [ tokenQuery.data ]);

  const transfersQuery = useQueryWithPages({
    resourceName: 'token_transfers',
    pathParams: { hash: hashString },
    scrollRef,
    options: {
      enabled: Boolean(router.query.hash && (!router.query.tab || router.query.tab === 'token_transfers') && tokenQuery.data && contractQuery.data),
      placeholderData: tokenStubs.getTokenTransfersStub(tokenQuery.data?.type),
    },
  });

  const holdersQuery = useQueryWithPages({
    resourceName: 'token_holders',
    pathParams: { hash: hashString },
    scrollRef,
    options: {
      enabled: Boolean(router.query.hash && router.query.tab === 'holders' && tokenQuery.data && contractQuery.data),
      placeholderData: tokenStubs.TOKEN_HOLDERS,
    },
  });

  const inventoryQuery = useQueryWithPages({
    resourceName: 'token_inventory',
    pathParams: { hash: hashString },
    scrollRef,
    options: {
      enabled: Boolean(router.query.hash && router.query.tab === 'inventory' && tokenQuery.data && contractQuery.data),
      placeholderData: tokenStubs.TOKEN_INSTANCES,
    },
  });

  const contractTabs = useContractTabs(contractQuery.data);

  const tabs: Array<RoutedTab> = [
    { id: 'token_transfers', title: 'Token transfers', component: <TokenTransfer transfersQuery={ transfersQuery } token={ tokenQuery.data }/> },
    { id: 'holders', title: 'Holders', component: <TokenHolders tokenQuery={ tokenQuery } holdersQuery={ holdersQuery }/> },
    (tokenQuery.data?.type === 'ERC-1155' || tokenQuery.data?.type === 'ERC-721') ?
      { id: 'inventory', title: 'Inventory', component: <TokenInventory inventoryQuery={ inventoryQuery }/> } :
      undefined,
    {
      id: 'contract',
      title: () => {
        if (contractQuery.data?.is_verified) {
          return (
            <>
              <span>Contract</span>
              <Icon as={ iconSuccess } boxSize="14px" color="green.500" ml={ 1 }/>
            </>
          );
        }

        return 'Contract';
      },
      component: <AddressContract tabs={ contractTabs } addressHash={ hashString }/>,
      subTabs: contractTabs.map(tab => tab.id),
    },
  ].filter(Boolean);

  let hasPagination;
  let pagination;

  if (!router.query.tab || router.query.tab === 'token_transfers') {
    hasPagination = transfersQuery.isPaginationVisible;
    pagination = transfersQuery.pagination;
  }

  if (router.query.tab === 'holders') {
    hasPagination = holdersQuery.isPaginationVisible;
    pagination = holdersQuery.pagination;
  }

  if (router.query.tab === 'inventory') {
    hasPagination = inventoryQuery.isPaginationVisible;
    pagination = inventoryQuery.pagination;
  }

  const tokenSymbolText = tokenQuery.data?.symbol ? ` (${ trimTokenSymbol(tokenQuery.data.symbol) })` : '';

  const tabListProps = React.useCallback(({ isSticky, activeTabIndex }: { isSticky: boolean; activeTabIndex: number }) => {
    if (isMobile) {
      return { mt: 8 };
    }

    return {
      mt: 3,
      py: 5,
      marginBottom: 0,
      boxShadow: activeTabIndex === 2 && isSticky ? 'action_bar' : 'none',
    };
  }, [ isMobile ]);

  return (
    <>
      <TextAd mb={ 6 }/>
      <PageTitle
        isLoading={ tokenQuery.isPlaceholderData }
        text={ `${ tokenQuery.data?.name || 'Unnamed' }${ tokenSymbolText } token` }
        backLinkUrl={ hasGoBackLink ? appProps.referrer : undefined }
        backLinkLabel="Back to tokens list"
        additionalsLeft={ (
          <TokenLogo hash={ tokenQuery.data?.address } name={ tokenQuery.data?.name } boxSize={ 6 } isLoading={ tokenQuery.isPlaceholderData }/>
        ) }
        additionalsRight={ <Skeleton isLoaded={ !tokenQuery.isPlaceholderData } borderRadius="sm"><Tag>{ tokenQuery.data?.type }</Tag></Skeleton> }
      />
      <TokenContractInfo tokenQuery={ tokenQuery } contractQuery={ contractQuery }/>
      <TokenDetails tokenQuery={ tokenQuery }/>
      { /* should stay before tabs to scroll up with pagination */ }
      <Box ref={ scrollRef }></Box>

      { tokenQuery.isPlaceholderData || contractQuery.isPlaceholderData ?
        <SkeletonTabs tabs={ tabs }/> :
        (
          <RoutedTabs
            tabs={ tabs }
            tabListProps={ tabListProps }
            rightSlot={ !isMobile && hasPagination ? <Pagination { ...(pagination as PaginationProps) }/> : null }
            stickyEnabled={ !isMobile }
          />
        ) }

      { !tokenQuery.isLoading && !tokenQuery.isError && <Box h={{ base: 0, lg: '40vh' }}/> }
    </>
  );
};

export default TokenPageContent;
