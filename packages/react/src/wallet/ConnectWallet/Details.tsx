import { ChainIcon } from "../../components/ChainIcon";
import { CopyIcon } from "../../components/CopyIcon";
import { Img } from "../../components/Img";
import { Modal } from "../../components/Modal";
import { Skeleton } from "../../components/Skeleton";
import { Spacer } from "../../components/Spacer";
import { ToolTip } from "../../components/Tooltip";
import { Button, IconButton } from "../../components/buttons";
import {
  fontSize,
  iconSize,
  media,
  radius,
  spacing,
  Theme,
} from "../../design-system";
import { isMobile } from "../../evm/utils/isMobile";
import { NetworkSelector, type NetworkSelectorProps } from "./NetworkSelector";
import { ExitIcon } from "./icons/ExitIcon";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronRightIcon,
  EnterIcon,
  PaperPlaneIcon,
  PinBottomIcon,
  ShuffleIcon,
  TextAlignLeftIcon,
} from "@radix-ui/react-icons";
import { Localhost } from "@thirdweb-dev/chains";
import {
  useChain,
  useAddress,
  useBalance,
  useChainId,
  useDisconnect,
  useSDK,
  useSupportedChains,
  useWallet,
  WalletInstance,
  useENS,
} from "@thirdweb-dev/react-core";
import { useEffect, useState } from "react";
import {
  MetaMaskWallet,
  type SmartWallet,
  walletIds,
  type EmbeddedWallet,
} from "@thirdweb-dev/wallets";
import { Container } from "../../components/basic";
import { FundsIcon } from "./icons/FundsIcon";
import { ExportLocalWallet } from "../wallets/localWallet/ExportLocalWallet";
import { useWalletContext } from "@thirdweb-dev/react-core";
import { useWalletConfig } from "@thirdweb-dev/react-core";
import type { LocalWalletConfig } from "../wallets/localWallet/types";
import { fadeInAnimation } from "../../design-system/animations";
import { Link, Text } from "../../components/text";
import { SendFunds } from "./SendFunds";
import { SupportedTokens } from "./defaultTokens";
import { ReceiveFunds } from "./ReceiveFunds";
import { smartWalletIcon } from "./icons/dataUris";
import { useTWLocale } from "../../evm/providers/locale-provider";
import { shortenString } from "@thirdweb-dev/react-core";
import {
  StyledButton,
  StyledDiv,
  StyledLabel,
} from "../../design-system/elements";
import { useCustomTheme } from "../../design-system/CustomThemeProvider";
import {
  appleIconUri,
  facebookIconUri,
  googleIconUri,
} from "./icons/socialLogins";
import { useEmbeddedWalletUserEmail } from "../../evm/hooks/wallets/useEmbeddedWallet";

export type DropDownPosition = {
  side: "top" | "bottom" | "left" | "right";
  align: "start" | "center" | "end";
};

const TW_CONNECTED_WALLET = "tw-connected-wallet";

export const ConnectedWalletDetails: React.FC<{
  dropdownPosition?: DropDownPosition;
  onDisconnect: () => void;
  style?: React.CSSProperties;
  networkSelector?: Omit<
    NetworkSelectorProps,
    "theme" | "onClose" | "chains" | "open"
  >;
  className?: string;
  detailsBtn?: () => JSX.Element;
  hideTestnetFaucet?: boolean;
  theme: "light" | "dark" | Theme;
  supportedTokens: SupportedTokens;
  displayBalanceToken?: Record<number, string>;
  hideSwitchToPersonalWallet?: boolean;
  hideDisconnect?: boolean;
}> = (props) => {
  const locale = useTWLocale().connectWallet;
  const chain = useChain();
  const walletChainId = useChainId();

  const disconnect = useDisconnect();
  const chains = useSupportedChains();
  const address = useAddress();

  const token =
    walletChainId && props.displayBalanceToken
      ? props.displayBalanceToken[walletChainId]
      : undefined;

  const balanceQuery = useBalance(token);
  const activeWallet = useWallet();
  const activeWalletConfig = useWalletConfig();
  const ensQuery = useENS();

  const walletContext = useWalletContext();

  const wrapperWallet = activeWallet
    ? walletContext.getWrapperWallet(activeWallet)
    : undefined;

  const [overrideWalletIconUrl, setOverrideWalletIconUrl] = useState<
    string | undefined
  >(undefined);

  // modals
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sdk = useSDK();

  const personalWallet = activeWallet?.getPersonalWallet() as
    | WalletInstance
    | undefined;

  const personalWalletConfig =
    personalWallet && walletContext.getWalletConfig(personalWallet);
  const wrapperWalletConfig =
    wrapperWallet && walletContext.getWalletConfig(wrapperWallet);

  const disableSwitchChain = !!personalWallet;

  const isActuallyMetaMask =
    activeWallet && activeWallet instanceof MetaMaskWallet;

  const shortAddress = address ? shortenString(address) : "";

  const addressOrENS = ensQuery.data?.ens || shortAddress;
  const avatarUrl = ensQuery.data?.avatarUrl;

  useEffect(() => {
    if (activeWallet) {
      if (activeWallet.walletId === walletIds.embeddedWallet) {
        (activeWallet as EmbeddedWallet)
          .getLastUsedAuthStrategy()
          .then((auth) => {
            if (auth === "apple") {
              setOverrideWalletIconUrl(appleIconUri);
            } else if (auth === "google") {
              setOverrideWalletIconUrl(googleIconUri);
            } else if (auth === "facebook") {
              setOverrideWalletIconUrl(facebookIconUri);
            } else {
              setOverrideWalletIconUrl(undefined);
            }
          });
      } else if (activeWallet.walletId === walletIds.smartWallet) {
        setOverrideWalletIconUrl(smartWalletIcon);
      } else {
        setOverrideWalletIconUrl(undefined);
      }
    } else {
      setOverrideWalletIconUrl(undefined);
    }
  }, [activeWallet]);

  const walletIconUrl =
    overrideWalletIconUrl || activeWalletConfig?.meta.iconURL || "";
  const avatarOrWalletIconUrl = avatarUrl || walletIconUrl;

  const trigger = props.detailsBtn ? (
    <div>
      <props.detailsBtn />
    </div>
  ) : (
    <WalletInfoButton
      type="button"
      className={`${TW_CONNECTED_WALLET} ${props.className || ""}`}
      style={props.style}
      data-test="connected-wallet-details"
    >
      <Img
        width={iconSize.lg}
        height={iconSize.lg}
        src={avatarOrWalletIconUrl}
        className={`${TW_CONNECTED_WALLET}__wallet-icon`}
        style={{
          borderRadius: radius.sm,
        }}
      />

      <Container flex="column" gap="xxs">
        {/* Address */}
        {activeWallet?.walletId === walletIds.localWallet ? (
          <Text
            color="danger"
            size="xs"
            style={{
              minWidth: "70px",
            }}
          >
            {locale.guest}
          </Text>
        ) : addressOrENS ? (
          <Text
            size="sm"
            color="primaryText"
            weight={500}
            className={`${TW_CONNECTED_WALLET}__address`}
          >
            {addressOrENS}
          </Text>
        ) : (
          <Skeleton height={fontSize.sm} width="88px" />
        )}

        {/* Balance */}
        {balanceQuery.data ? (
          <Text
            className={`${TW_CONNECTED_WALLET}__balance`}
            size="xs"
            weight={500}
          >
            {Number(balanceQuery.data.displayValue).toFixed(3)}{" "}
            {balanceQuery.data.symbol}
          </Text>
        ) : (
          <Skeleton height={fontSize.xs} width="82px" />
        )}
      </Container>
    </WalletInfoButton>
  );

  let networkSwitcherButton = (
    <MenuButton
      type="button"
      disabled={disableSwitchChain}
      onClick={() => {
        setIsDropdownOpen(false);
        setShowNetworkSelector(true);
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <ChainIcon chain={chain} size={iconSize.md} active />
      </div>
      <Text size="sm" color="primaryText" multiline>
        {chain?.name || `Unknown chain #${walletChainId}`}
      </Text>
      <StyledChevronRightIcon
        width={iconSize.sm}
        height={iconSize.sm}
        style={{
          flexShrink: 0,
          marginLeft: "auto",
        }}
      />
    </MenuButton>
  );

  if (!disableSwitchChain) {
    networkSwitcherButton = (
      <ToolTip tip={locale.switchNetwork}>{networkSwitcherButton}</ToolTip>
    );
  }

  const content = (
    <div>
      {/* Balance and Account Address */}
      <Container flex="row" gap="sm">
        <Img
          width={iconSize.xl}
          height={iconSize.xl}
          src={avatarOrWalletIconUrl}
          alt=""
          style={{
            borderRadius: radius.sm,
          }}
        />

        <div
          style={{
            flexGrow: 1,
          }}
        >
          {/* row 1 */}
          <Container gap="xs" flex="row" center="y">
            <div
              style={{
                display: "flex",
                gap: spacing.xs,
                alignItems: "center",
              }}
              data-test="connected-wallet-address"
              data-address={address}
            >
              <Text color="primaryText" weight={500}>
                {addressOrENS}
              </Text>
              <IconButton
                style={{
                  padding: "3px",
                }}
                data-test="copy-address"
              >
                <CopyIcon
                  text={address || ""}
                  tip={locale.copyAddress}
                  side="bottom"
                />
              </IconButton>
            </div>

            {!props.hideDisconnect && (
              <ToolTip
                tip={locale.disconnectWallet}
                side="bottom"
                align={"end"}
                sideOffset={10}
              >
                <DisconnectIconButton
                  type="button"
                  onClick={() => {
                    disconnect();
                    props.onDisconnect();
                  }}
                >
                  <ExitIcon size={iconSize.md} />
                </DisconnectIconButton>
              </ToolTip>
            )}
          </Container>

          {/* row 2 */}
          <Text weight={500} size="sm">
            {" "}
            {balanceQuery.data ? (
              Number(balanceQuery.data.displayValue).toFixed(3)
            ) : (
              <Skeleton height="1em" width="100px" />
            )}{" "}
            {balanceQuery.data?.symbol}{" "}
          </Text>
        </div>
      </Container>

      <Spacer y="lg" />

      <ConnectedToSmartWallet />
      <EmbeddedWalletEmail />

      {/* Send and Receive */}
      <Container
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.sm,
        }}
      >
        <Button
          variant="outline"
          style={{
            fontSize: fontSize.sm,
            display: "flex",
            gap: spacing.xs,
            alignItems: "center",
            padding: spacing.sm,
          }}
          onClick={() => {
            setShowSendModal(true);
            setIsDropdownOpen(false);
          }}
        >
          <PaperPlaneIcon
            width={iconSize.sm}
            height={iconSize.sm}
            style={{
              transform: "translateY(-10%) rotate(-45deg) ",
            }}
          />
          {locale.send}
        </Button>

        <Button
          variant="outline"
          style={{
            fontSize: fontSize.sm,
            display: "flex",
            gap: spacing.xs,
            alignItems: "center",
            padding: spacing.sm,
          }}
          onClick={() => {
            setShowReceiveModal(true);
            setIsDropdownOpen(false);
          }}
        >
          <PinBottomIcon width={iconSize.sm} height={iconSize.sm} />{" "}
          {locale.receive}{" "}
        </Button>
      </Container>

      <Spacer y="lg" />

      {/* Network Switcher */}
      <div>
        <DropdownLabel>{locale.currentNetwork}</DropdownLabel>
        <Spacer y="xs" />
        {networkSwitcherButton}
      </div>

      <Spacer y="md" />

      <Container flex="column" gap="sm">
        {/* Switch to Personal Wallet for Safe */}
        {personalWallet &&
          personalWalletConfig &&
          !props.hideSwitchToPersonalWallet && (
            <WalletSwitcher
              wallet={personalWallet}
              name={locale.personalWallet}
            />
          )}

        {/* Switch to Wrapper Wallet */}
        {wrapperWalletConfig && wrapperWallet && (
          <WalletSwitcher
            name={
              wrapperWallet.walletId === walletIds.smartWallet
                ? locale.smartWallet
                : wrapperWalletConfig.meta.name
            }
            wallet={wrapperWallet}
          />
        )}

        {/* Switch Account for Metamask */}
        {isActuallyMetaMask &&
          activeWalletConfig &&
          activeWalletConfig.isInstalled &&
          activeWalletConfig.isInstalled() &&
          !isMobile() && (
            <MenuButton
              type="button"
              onClick={() => {
                (activeWallet as MetaMaskWallet).switchAccount();
                setIsDropdownOpen(false);
              }}
              style={{
                fontSize: fontSize.sm,
              }}
            >
              <Container color="secondaryText">
                <ShuffleIcon width={iconSize.sm} height={iconSize.sm} />
              </Container>
              {locale.switchAccount}
            </MenuButton>
          )}

        {/* Request Testnet funds */}
        {!props.hideTestnetFaucet &&
          ((chain?.faucets && chain.faucets.length > 0) ||
            chain?.chainId === Localhost.chainId) && (
            <MenuLink
              href={chain?.faucets ? chain.faucets[0] : "#"}
              target="_blank"
              as="a"
              onClick={async (e) => {
                if (chain.chainId === Localhost.chainId) {
                  e.preventDefault();
                  setIsDropdownOpen(false);
                  await sdk?.wallet.requestFunds(10);
                  await balanceQuery.refetch();
                }
              }}
              style={{
                textDecoration: "none",
                color: "inherit",
                fontSize: fontSize.sm,
              }}
            >
              <Container flex="row" center="both" color="secondaryText">
                <FundsIcon size={iconSize.sm} />
              </Container>
              {locale.requestTestnetFunds}
            </MenuLink>
          )}

        {/* Explorer link */}
        {chain?.explorers && chain.explorers[0]?.url && (
          <MenuLink
            href={chain.explorers[0].url + "/address/" + address}
            target="_blank"
            as="a"
            style={{
              textDecoration: "none",
              color: "inherit",
              fontSize: fontSize.sm,
            }}
          >
            <Container flex="row" center="both" color="secondaryText">
              <TextAlignLeftIcon width={iconSize.sm} height={iconSize.sm} />
            </Container>
            {locale.transactionHistory}
          </MenuLink>
        )}

        {/* Export  Wallet */}
        {activeWallet?.walletId === walletIds.localWallet && (
          <div>
            <MenuButton
              onClick={() => {
                setShowExportModal(true);
                setIsDropdownOpen(false);
              }}
              style={{
                fontSize: fontSize.sm,
              }}
            >
              <Container flex="row" center="both" color="secondaryText">
                <PinBottomIcon width={iconSize.sm} height={iconSize.sm} />
              </Container>
              {locale.backupWallet}{" "}
            </MenuButton>
            <Spacer y="md" />
            <Text size="xs" center multiline color="danger" balance>
              {locale.guestWalletWarning}
            </Text>
          </div>
        )}
      </Container>
    </div>
  );

  return (
    <>
      {isMobile() ? (
        <Modal
          size={"compact"}
          trigger={trigger}
          open={isDropdownOpen}
          setOpen={setIsDropdownOpen}
          hideCloseIcon={true}
        >
          <Container p="lg">{content}</Container>
        </Modal>
      ) : (
        <DropdownMenu.Root
          open={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
        >
          <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropDownContent
              asChild
              side={props.dropdownPosition?.side || "bottom"}
              align={props.dropdownPosition?.align || "end"}
              sideOffset={10}
            >
              {content}
            </DropDownContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      <NetworkSelector
        open={showNetworkSelector}
        theme={props.theme}
        chains={chains}
        {...props.networkSelector}
        onClose={() => setShowNetworkSelector(false)}
      />

      <Modal
        size={"compact"}
        open={showExportModal}
        setOpen={setShowExportModal}
      >
        <ExportLocalWallet
          modalSize="compact"
          localWalletConfig={activeWalletConfig as LocalWalletConfig}
          onExport={() => {
            setShowExportModal(false);
          }}
          walletAddress={address}
          walletInstance={activeWallet}
        />
      </Modal>

      <Modal size={"compact"} open={showSendModal} setOpen={setShowSendModal}>
        <SendFunds supportedTokens={props.supportedTokens} />
      </Modal>

      <Modal
        size={"compact"}
        open={showReceiveModal}
        setOpen={setShowReceiveModal}
      >
        <ReceiveFunds iconUrl={walletIconUrl} />
      </Modal>
    </>
  );
};

const dropdownContentFade = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const DropDownContent = /* @__PURE__ */ (() =>
  styled(DropdownMenu.Content)(() => {
    const theme = useCustomTheme();
    return {
      width: "360px",
      boxSizing: "border-box",
      maxWidth: "100%",
      borderRadius: radius.lg,
      padding: spacing.lg,
      animation: `${dropdownContentFade} 400ms cubic-bezier(0.16, 1, 0.3, 1)`,
      willChange: "transform, opacity",
      border: `1px solid ${theme.colors.borderColor}`,
      backgroundColor: theme.colors.dropdownBg,
      "--bg": theme.colors.dropdownBg,
      zIndex: 1000000,
      lineHeight: "normal",
    };
  }))();

const WalletInfoButton = /* @__PURE__ */ StyledButton(() => {
  const theme = useCustomTheme();
  return {
    all: "unset",
    background: theme.colors.connectedButtonBg,
    border: `1px solid ${theme.colors.borderColor}`,
    padding: `${spacing.sm} ${spacing.sm}`,
    borderRadius: radius.lg,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    minWidth: "180px",
    gap: spacing.sm,
    boxSizing: "border-box",
    WebkitTapHighlightColor: "transparent",
    lineHeight: "normal",
    animation: `${fadeInAnimation} 300ms ease`,
    [media.mobile]: {
      gap: spacing.sm,
      padding: `${spacing.xs} ${spacing.sm}`,
      img: {
        width: `${iconSize.md}px`,
        height: `${iconSize.md}px`,
      },
    },
    "&:hover": {
      transition: "background 250ms ease",
      background: theme.colors.connectedButtonBgHover,
    },
  };
});

const DropdownLabel = /* @__PURE__ */ StyledLabel(() => {
  const theme = useCustomTheme();
  return {
    fontSize: fontSize.sm,
    color: theme.colors.secondaryText,
    fontWeight: 500,
  };
});

const MenuButton = /* @__PURE__ */ StyledButton(() => {
  const theme = useCustomTheme();
  return {
    all: "unset",
    padding: `${spacing.sm} ${spacing.sm}`,
    borderRadius: radius.md,
    backgroundColor: "transparent",
    border: `1px solid ${theme.colors.borderColor}`,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    width: "100%",
    cursor: "pointer",
    fontSize: fontSize.md,
    fontWeight: 500,
    color: `${theme.colors.primaryText} !important`,
    gap: spacing.sm,
    WebkitTapHighlightColor: "transparent",
    lineHeight: 1.3,
    "&:not([disabled]):hover": {
      transition: "box-shadow 250ms ease, border-color 250ms ease",
      border: `1px solid ${theme.colors.accentText}`,
      boxShadow: `0 0 0 1px ${theme.colors.accentText}`,
    },
    "&[disabled]": {
      cursor: "not-allowed",
      svg: {
        display: "none",
      },
    },
    "&[disabled]:hover": {
      transition: "box-shadow 250ms ease, border-color 250ms ease",
      border: `1px solid ${theme.colors.danger}`,
      boxShadow: `0 0 0 1px ${theme.colors.danger}`,
    },
  };
});

const MenuLink = /* @__PURE__ */ (() => MenuButton.withComponent("a"))();

export const StyledChevronRightIcon = /* @__PURE__ */ styled(
  /* @__PURE__ */ ChevronRightIcon,
)(() => {
  const theme = useCustomTheme();
  return {
    color: theme.colors.secondaryText,
  };
});

const DisconnectIconButton = /* @__PURE__ */ styled(IconButton)(() => {
  const theme = useCustomTheme();
  return {
    marginRight: `-${spacing.xxs}`,
    marginLeft: "auto",
    color: theme.colors.secondaryText,
    "&:hover": {
      color: theme.colors.danger,
      background: "none",
    },
  };
});

function WalletSwitcher({
  wallet,
  name,
}: {
  wallet: WalletInstance;
  name: string;
}) {
  const walletContext = useWalletContext();
  const locale = useTWLocale().connectWallet;

  return (
    <MenuButton
      type="button"
      onClick={() => {
        walletContext.setConnectedWallet(wallet);
      }}
      style={{
        fontSize: fontSize.sm,
      }}
    >
      <Container color="secondaryText">
        <EnterIcon width={iconSize.sm} height={iconSize.sm} />
      </Container>
      {locale.switchTo} {name}
    </MenuButton>
  );
}

const ActiveDot = /* @__PURE__ */ StyledDiv(() => {
  const theme = useCustomTheme();
  return {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: theme.colors.success,
  };
});

function ConnectedToSmartWallet() {
  const activeWallet = useWallet();
  const chain = useChain();
  const address = useAddress();
  const locale = useTWLocale().connectWallet;

  const [isSmartWalletDeployed, setIsSmartWalletDeployed] = useState(false);

  useEffect(() => {
    if (activeWallet && activeWallet.walletId === walletIds.smartWallet) {
      const smartWallet = activeWallet as SmartWallet;
      smartWallet.isDeployed().then((isDeployed) => {
        setIsSmartWalletDeployed(isDeployed);
      });
    } else {
      setIsSmartWalletDeployed(false);
    }
  }, [activeWallet]);

  const content = (
    <Container
      flex="row"
      gap="xs"
      center="y"
      style={{
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <Container flex="row" gap="xs" center="y">
        <ActiveDot />
        {locale.connectedToSmartWallet}
      </Container>
      {isSmartWalletDeployed && (
        <ChevronRightIcon width={iconSize.sm} height={iconSize.sm} />
      )}
    </Container>
  );

  if (chain && address && activeWallet?.walletId === walletIds.smartWallet) {
    return (
      <>
        {isSmartWalletDeployed ? (
          <Link
            color="secondaryText"
            hoverColor="primaryText"
            href={`https://thirdweb.com/${chain.slug}/${address}/account`}
            target="_blank"
            size="sm"
          >
            {content}
          </Link>
        ) : (
          <Text size="sm"> {content}</Text>
        )}

        <Spacer y="md" />
      </>
    );
  }

  return null;
}

function EmbeddedWalletEmail() {
  const emailQuery = useEmbeddedWalletUserEmail();

  if (emailQuery.data) {
    return (
      <Container
        style={{
          paddingBottom: spacing.md,
        }}
      >
        <Text color="primaryText">{emailQuery.data}</Text>
      </Container>
    );
  }

  return undefined;
}
