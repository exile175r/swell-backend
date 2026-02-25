import React from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, TextInput, ScrollView } from "react-native";
import {
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  MoreHorizontal,
  AlertCircle,
  Ban,
  Mic,
  PenTool,
  ArrowLeft,
  HelpCircle,
  ShieldAlert,
  Coins,
  Gem,
  CheckCircle2,
  ChevronRight,
  Search,
  ShieldCheck,
  Bell,
  Sparkles,
  ShoppingBag,
} from "lucide-react-native";
import { Modal, Alert, Animated, ActivityIndicator } from "react-native";
import WaveLogo from "../components/WaveLogo";
import { api } from "../services/api";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";
import AnimatedReanimated, { FadeInUp } from "react-native-reanimated";
import { useGlobalLoader } from "../hooks/useGlobalLoader";

/*
const StoreItem = ({ icon, title, price, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between p-5 bg-[#002845]/60 rounded-3xl border border-white/5 mb-3"
  >
    <View className="flex-row items-center">
      <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center">{icon}</View>
      <View className="ml-4">
        <Text className="text-white font-bold">{title}</Text>
        <Text className="text-[#00E0D0] text-[10px] mt-1">즉시 충전</Text>
      </View>
    </View>
    <View className="bg-[#00E0D0] px-4 py-2 rounded-xl">
      <Text className="text-[#001220] font-bold text-xs">{price}</Text>
    </View>
  </TouchableOpacity>
);
*/

const CATEGORIES = ["전체", "고민", "일상", "위로", "질문"];

export interface Post {
  id: string;
  userId: string;
  nickname: string;
  category: string;
  title: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
}

const MOCK_POSTS = [
  {
    id: "1",
    userId: "user1",
    nickname: "지친신입사원",
    category: "고민",
    title: "진짜 퇴사 마렵다.. 부장 새X 진짜",
    content:
      "입사한 지 한 달도 안 됐는데 오늘 회의실에서 내 기획서 면전에서 던져버림. 사람들 다 보는데 '이게 일이라고 해온 거냐'고 소리 지르는데 진짜 주먹 꽉 쥐었다. 화장실 가서 몰래 울고 왔는데 내가 왜 이런 취급 받아야 되는지 모르겠네...",
    time: "10분 전",
    likes: 45,
    comments: 12,
  },
  {
    id: "2",
    userId: "user2",
    nickname: "알바몬24시",
    category: "일상",
    title: "카페 알바 첫날인데 개진상 만남",
    content:
      "주문 좀 늦게 받았다고 다짜고짜 나한테 욕하면서 반말하는 아저씨... 내 잘못 아닌데 사장님은 내 편 안 들어주고 무조건 죄송하다고 빌래. 나도 우리 부모님 귀한 자식인데 왜 남한테 빌어야 됨? 다 때려치우고 싶다 진짜.",
    time: "32분 전",
    likes: 25,
    comments: 8,
  },
  {
    id: "3",
    userId: "user3",
    nickname: "숨쉬고싶다",
    category: "위로",
    title: "사수의 한숨 소리가 너무 무서워",
    content:
      "질문 하나 할 때마다 한숨 푹푹 쉬면서 '이것도 아직 몰라요?' 하는데 진짜 자존감 바닥친다. 나 나름 열심히 한다고 하는데... 내가 진짜 바보인가 싶고 내일 출근하기가 너무 무섭다. 누가 나 좀 살려줘.",
    time: "1시간 전",
    likes: 82,
    comments: 34,
  },
  {
    id: "4",
    userId: "user4",
    nickname: "퇴근원정대",
    category: "고민",
    title: "퇴근 10분 전에 일 던지는 팀장",
    content:
      "팀장은 퇴근 준비하면서 나는 내일 아침까지 끝내놓으라네? 자기는 내일 연차 쓰면서ㅋㅋㅋ 이거 가스라이팅 아님? 거절하면 협업 안 되는 사람 취급하니까 아무 말도 못 하고 다시 앉았다. 진짜 숨 막혀 죽을 것 같아.",
    time: "2시간 전",
    likes: 56,
    comments: 20,
  },
  {
    id: "5",
    userId: "user5",
    nickname: "지하철눈물녀",
    category: "일상",
    title: "나만 이렇게 사는 거 아니지...?",
    content:
      "집에 오는 지하철 안에서 그냥 멍하니 창밖만 보는데 갑자기 눈물이 터짐. 내가 무슨 영광을 보겠다고 이렇게 모욕당하며 살아야 하나 싶다. 부모님은 내가 좋은 회사 들어가서 잘 지내는 줄 아는데... 전화로 괜찮냐고 물어보는데 아무렇지 않은 척 목소리 가다듬는 게 제일 힘들다.",
    time: "5시간 전",
    likes: 124,
    comments: 56,
  },
];

/**
 * @description 익명 커뮤니티 홈 화면
 */
const HomeScreen = ({ navigation }: any) => {
  const [selectedCategory, setSelectedCategory] = React.useState("전체");
  const [showMenu, setShowMenu] = React.useState(false);
  const [showWriteOptions, setShowWriteOptions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [posts, setPosts] = React.useState<Post[]>(MOCK_POSTS);
  const [mutedUsers, setMutedUsers] = React.useState<string[]>([]);
  const [hasError, setHasError] = React.useState(false);
  const [showMyPosts, setShowMyPosts] = React.useState(false); // 내 활동 필터 추가
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [selectedPostToReport, setSelectedPostToReport] = React.useState<Post | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const [isBlockChecked, setIsBlockChecked] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(""); // 검색어 상태 추가
  const [showAuthorProfile, setShowAuthorProfile] = React.useState(false);
  const [isAuthorLoading, setIsAuthorLoading] = React.useState(false);
  const [authorProfile, setAuthorProfile] = React.useState<any>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [reportType, setReportType] = React.useState<"post" | "user">("post");
  const [selectedUserToReport, setSelectedUserToReport] = React.useState<{ id: string; nickname: string } | null>(null);

  const REPORT_REASONS = ["부적절한 내용", "비난 및 욕설", "스팸/홍보", "허위 사실", "기타"];

  const {
    status,
    nickname,
    dailyFreeTokens,
    totalTokens,
    useToken,
    addViewedPost,
    addTokenByAd,
    buyTokens,
    upgradeToVIP,
    setHasSeenGuide,
    hasSeenGuide,
    userId,
    appTheme,
    reportCounts: globalReportCounts,
    reportPost,
    penalty,
    blockedUsers,
    unblockUser,
    following,
    toggleFollow,
  } = useUserStore();
  const [showStore, setShowStore] = React.useState(false);
  const [onboardingStep, setOnboardingStep] = React.useState(0);
  const [showOnboarding, setShowOnboarding] = React.useState(!hasSeenGuide);
  const [likedPosts, setLikedPosts] = React.useState<Set<string>>(new Set());
  const { startLoading, stopLoading } = useGlobalLoader();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    {
      id: "n1",
      type: "like",
      content: "누군가 당신의 파도 '진짜 퇴사 마렵다..'에 공감했습니다.",
      time: "2분 전",
      isRead: false,
    },
    {
      id: "n2",
      type: "comment",
      content: "'새벽너울'님이 당신의 게시글에 따뜻한 위로를 남겼습니다.",
      time: "15분 전",
      isRead: false,
    },
    {
      id: "n3",
      type: "follow",
      content: "새로운 파도가 당신을 팔로우하기 시작했습니다.",
      time: "1시간 전",
      isRead: true,
    },
    {
      id: "n4",
      type: "event",
      content: "[이벤트] 이번 주말, '나'에게 집중하는 글쓰기 챌린지에 참여하고 특별 칭호를 획득하세요!",
      time: "3시간 전",
      isRead: false,
    },
    {
      id: "n5",
      type: "system",
      content: "[업데이트] 너울 2.1 버전이 출시되었습니다. 새로운 AI 요약 기능을 즐겨보세요!",
      time: "1일 전",
      isRead: true,
    },
  ]);

  const onboardingData = [
    {
      title: "어른들의 고요한 파도, 너울",
      content: "이곳은 사회에서의 가면을 벗고\n날것의 감정을 담아내는 공간입니다.",
      icon: <WaveLogo size={64} color={THEMES[appTheme].accent} />,
    },
    {
      title: "다양한 파도 탐험하기",
      content: "다른 사람들의 진솔한 이야기를\n자유롭게 읽고 공감해 보세요.",
      icon: <Gem size={48} color="#00E0D0" />,
    },
    {
      title: "당신의 파도 담기",
      content: "음성이나 텍스트로 당신의 이야기를\n솔직하게 쏟아내 보세요.\n제목을 잘 지을수록 더 많은 위로를 받아요.",
      icon: <PenTool size={48} color="#00E0D0" />,
    },
  ];

  const handleNextOnboarding = () => {
    if (onboardingStep < onboardingData.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      setHasSeenGuide(true);
    }
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handlePostPress = (post: Post) => {
    // 결제/토큰 시스템 숨기기: 조건 없이 바로 상세 페이지로 이동
    navigation.navigate("PostDetail", { post });
  };

  const filteredPosts = posts.filter((p) => {
    const isCategoryMatch = selectedCategory === "전체" || p.category === selectedCategory;
    const isMineMatch = !showMyPosts || p.userId === userId;
    const isSearchMatch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase());

    // 차단된 사용자의 글 필터링
    const isNotBlocked = !blockedUsers.some((blockedUser) => blockedUser.id === p.userId);

    // 신고 누적 필터링 (게시글 기준)
    const isNotSoftBanned = (globalReportCounts[p.id] || 0) < 5;

    return isCategoryMatch && isNotBlocked && isNotSoftBanned && isMineMatch && isSearchMatch;
  });

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      startLoading(1000); // 1초 이상 지연 시에만 전역 로딩 표시

      // ✅ 백엔드 데이터에 내 최신 닉네임 동기화 (데모 백엔드 대응)
      if (status !== "GUEST" && userId && nickname) {
        try {
          await api.users.syncProfile(userId, nickname);
        } catch (e) {
          console.log("Sync error ignored:", e);
        }
      }

      const data = await api.posts.get();
      // API 응답 구조에 맞게 매핑 (기본적으로 posts 배열이 온다고 가정)
      const mappedPosts: Post[] = Array.isArray(data)
        ? data.map((post: any) => ({
            id: post.id?.toString() || post._id?.toString(),
            userId: post.userId || "anonymous",
            nickname: post.nickname || "익명의 너울",
            category: post.category || "일상",
            title: post.title || "제목 없는 파도",
            content: post.content,
            time: post.createdAt ? "방금 전" : "1시간 전",
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
          }))
        : [];
      setPosts(mappedPosts.length > 0 ? mappedPosts : MOCK_POSTS);
    } catch (error) {
      console.error("API Fetch Error:", error);
      // 서버 연결 실패 시 가짜 데이터(Mock)로 강제 전환하여 서비스 지속
      setPosts(MOCK_POSTS);
      // 사용자에게 서버 상태 알림 (선택 사항)
      // Alert.alert("연결 안내", "현재 실시간 서버가 불안정하여 준비된 데이터로 표시합니다.");
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    startLoading(800);
    await fetchPosts();
    setIsRefreshing(false);
    stopLoading();
  };

  const fetchAuthorProfile = async (targetUserId: string) => {
    try {
      setIsAuthorLoading(true);
      setShowAuthorProfile(true);
      setIsExpanded(false);
      const response = await api.users.getProfile(targetUserId);
      if (response.success) {
        setAuthorProfile(response.data);
      }
    } catch (error) {
      console.error("Fetch Author Profile Error:", error);
    } finally {
      setIsAuthorLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  const handleReport = (post: Post) => {
    Alert.alert("신고하기", "신고 대상을 선택해 주세요.", [
      { text: "취소", style: "cancel" },
      {
        text: "게시글 신고",
        onPress: () => {
          setSelectedPostToReport(post);
          setReportType("post");
          setReportReason("");
          setIsBlockChecked(post.userId !== userId);
          setShowReportModal(true);
        },
      },
      {
        text: "회원 신고",
        onPress: () => {
          setSelectedUserToReport({ id: post.userId, nickname: post.nickname });
          setReportType("user");
          setReportReason("");
          setIsBlockChecked(true);
          setShowReportModal(true);
        },
      },
    ]);
  };

  const handleReportMember = (id: string, targetNickname: string) => {
    setShowAuthorProfile(false);
    setTimeout(() => {
      setSelectedUserToReport({ id, nickname: targetNickname });
      setReportType("user");
      setReportReason("");
      setIsBlockChecked(true);
      setShowReportModal(true);
    }, 300);
  };

  const submitReport = () => {
    if (!reportReason) {
      Alert.alert("알림", "신고 사유를 선택해 주세요.");
      return;
    }

    if (reportType === "post" && selectedPostToReport) {
      const result = reportPost(selectedPostToReport.id);
      if (result.success && isBlockChecked && selectedPostToReport.userId) {
        useUserStore.getState().blockUser(selectedPostToReport.userId, selectedPostToReport.nickname);
      }
    } else if (reportType === "user" && selectedUserToReport) {
      const result = useUserStore.getState().reportUser(selectedUserToReport.id, reportReason);
      if (result.success && isBlockChecked) {
        useUserStore.getState().blockUser(selectedUserToReport.id, selectedUserToReport.nickname);
      }
    }

    setShowReportModal(false);
    Alert.alert(
      "신고 완료",
      reportType === "post"
        ? "게시글 신고가 정상적으로 접수되었습니다."
        : "회원 신고 및 차단이 정상적으로 접수되었습니다.",
    );
  };

  const handleBlock = (targetUserId: string, targetNickname: string) => {
    if (!targetUserId || targetUserId === "anonymous") {
      Alert.alert("알림", "익명 사용자는 개별 차단이 어렵습니다.");
      return;
    }
    // 차단도 신고 모달의 '회원 신고' 로직을 공유하여 사유를 수집하거나 일관된 UX 제공
    handleReportMember(targetUserId, targetNickname);
  };

  const handleToggleFollow = async (targetUserId: string, targetNickname: string) => {
    if (!targetUserId) return;

    try {
      const isCurrentlyFollowing = following.some((f) => f.id === targetUserId);
      await api.users.toggleFollow(userId || "anonymous", targetUserId);
      toggleFollow(targetUserId, targetNickname);
    } catch (error) {
      Alert.alert("알림", "팔로우 처리에 실패했습니다.");
    }
  };

  const menuItems = [
    {
      icon: <User size={22} color={THEMES[appTheme].text} />,
      label: "프로필 계정",
      onPress: () => {
        setShowMenu(false);
        navigation.navigate("Profile");
      },
    },
    {
      icon: <MessageSquare size={22} color={THEMES[appTheme].accent} />,
      label: "내가 쓴 글",
      onPress: () => {
        setShowMyPosts(true);
        setShowMenu(false);
      },
    },
    {
      icon: <HelpCircle size={22} color={THEMES[appTheme].text} />,
      label: "고객센터",
      onPress: () => {
        setShowMenu(false);
        navigation.navigate("Support");
      },
    },
    {
      icon: <Settings size={22} color={THEMES[appTheme].text} />,
      label: "환경 설정",
      onPress: () => {
        setShowMenu(false);
        navigation.navigate("Settings");
      },
    },
    {
      icon: <LogOut size={22} color="#E7433C" />,
      label: "로그아웃",
      onPress: () => {
        useUserStore.getState().resetStore();
        navigation.replace("Login");
      },
      isDanger: true,
    },
  ];

  const getBgTint = () => {
    const baseColor = THEMES[appTheme].bg;
    // 카테고리별 미세한 색조 변화는 테마 시스템과 충돌할 수 있으므로 베이스 컬러를 유지하되 오버레이 수준에서 조정
    return baseColor;
  };

  return (
    <SafeAreaView style={{ backgroundColor: getBgTint() }} className="flex-1 transition-colors duration-500">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-3 flex-row justify-between items-center">
          {/* Left Side: Back Arrow (only when showing my posts) */}
          <View className="w-12 h-12">
            {showMyPosts && (
              <TouchableOpacity
                onPress={() => setShowMyPosts(false)}
                style={{ backgroundColor: THEMES[appTheme].surface }}
                className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5 shadow-lg"
              >
                <ArrowLeft size={24} color={THEMES[appTheme].accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Center: Logo & Brand Name */}
          <View className="items-center flex-row">
            <View className="mr-3">
              <WaveLogo size={24} color={THEMES[appTheme].accent} />
            </View>
            <View>
              <Text style={{ color: THEMES[appTheme].text }} className="text-lg font-black tracking-tight">
                {showMyPosts ? "내가 담은 파도" : "너울"}
              </Text>
            </View>
          </View>

          {/* Right Side: Notification & Menu Buttons */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5 shadow-lg relative mr-2"
            >
              <Bell size={24} color={THEMES[appTheme].text} />
              {notifications.some((n) => !n.isRead) && (
                <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#E7433C] rounded-full border-2 border-[#12202C]" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5 shadow-lg"
            >
              <Menu size={24} color={THEMES[appTheme].text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
            className="flex-row items-center rounded-3xl border border-white/5 px-5 h-14"
          >
            <Search size={20} color={THEMES[appTheme].accent} opacity={0.6} />
            <TextInput
              style={{ color: THEMES[appTheme].text }}
              className="flex-1 ml-3 text-base font-medium"
              placeholder="파도 속에서 이야기 찾기..."
              placeholderTextColor={THEMES[appTheme].text + "40"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="w-8 h-8 items-center justify-center bg-white/5 rounded-full"
              >
                <X size={16} color={THEMES[appTheme].text} opacity={0.4} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Bar */}
        <View className="mb-4">
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
            renderItem={({ item }: { item: string }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={{
                  backgroundColor:
                    selectedCategory === item ? THEMES[appTheme].accent : THEMES[appTheme].surface + "66",
                  borderColor: selectedCategory === item ? THEMES[appTheme].accent : "rgba(255,255,255,0.05)",
                }}
                className={`px-3.5 py-1.5 rounded-full mx-1 border`}
              >
                <Text
                  style={{ color: selectedCategory === item ? THEMES[appTheme].bg : THEMES[appTheme].text }}
                  className={`text-[12.5px] font-bold ${selectedCategory !== item && "opacity-60"}`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item: string) => item}
          />
        </View>

        {isLoading ? (
          <View className="px-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
                className="p-8 rounded-[40px] border border-white/5 space-y-4"
              >
                <View className="h-4 bg-white/10 rounded-full w-3/4" />
                <View className="h-4 bg-white/10 rounded-full w-1/2" />
                <View className="h-20" />
                <View className="flex-row justify-between items-center">
                  <View className="h-6 bg-white/5 rounded-full w-20 animate-pulse" />
                  <View className="flex-row space-x-2">
                    <View className="h-8 bg-white/5 rounded-full w-12 animate-pulse" />
                    <View className="h-8 bg-white/5 rounded-full w-12 animate-pulse" />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            renderItem={({ item }: { item: Post }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handlePostPress(item)}
                style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                className="p-6 s24:p-8 rounded-[32px] mb-5 s24:mb-6 border border-white/5 shadow-sm"
              >
                <View className="mb-5 s24:mb-6">
                  <View className="flex-row justify-between items-start">
                    <View className="self-start">
                      <Text
                        style={{ color: THEMES[appTheme].accent }}
                        className="text-[10px] font-bold tracking-[2px] mb-2 uppercase"
                      >
                        {item.nickname}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleReport(item);
                      }}
                      className="opacity-40 p-1"
                    >
                      <AlertCircle size={16} color={THEMES[appTheme].text} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{ color: THEMES[appTheme].text }}
                    className="text-lg font-bold leading-7"
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mt-4">
                  <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-medium opacity-30">
                    {item.time}
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e: any) => {
                        e.stopPropagation();
                        handleToggleLike(item.id);
                      }}
                      style={{ backgroundColor: THEMES[appTheme].bg + "66" }}
                      className="flex-row items-center px-4 py-2 rounded-full mr-2"
                    >
                      <Heart
                        size={14}
                        color={THEMES[appTheme].accent}
                        fill={likedPosts.has(item.id) ? THEMES[appTheme].accent : "transparent"}
                      />
                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-bold ml-2 opacity-60">
                        {likedPosts.has(item.id) ? item.likes + 1 : item.likes}
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={{ backgroundColor: THEMES[appTheme].bg + "66" }}
                      className="flex-row items-center px-4 py-2 rounded-full"
                    >
                      <MessageSquare size={14} color={THEMES[appTheme].text} />
                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-bold ml-2 opacity-60">
                        {item.comments}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Action Button for Recording */}
        <TouchableOpacity
          onPress={() => setShowWriteOptions(true)}
          activeOpacity={0.8}
          style={[
            { backgroundColor: THEMES[appTheme].accent },
            Platform.select({
              ios: { shadowColor: THEMES[appTheme].accent, shadowOpacity: 0.5, shadowRadius: 20 },
              android: { elevation: 10 },
              web: { boxShadow: `0px 0px 20px ${THEMES[appTheme].accent}80` },
            }),
          ]}
          className="absolute bottom-10 right-6 w-16 h-16 s24:w-20 s24:h-20 rounded-[24px] s24:rounded-[30px] items-center justify-center shadow-2xl"
        >
          <Plus size={32} color={THEMES[appTheme].bg} />
        </TouchableOpacity>

        {/* Choice Modal for Write/Voice */}
        <Modal
          visible={showWriteOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWriteOptions(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowWriteOptions(false)}
            className="flex-1 bg-black/60 items-center justify-end pb-40"
          >
            <View className="flex-row space-x-8">
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => {
                    setShowWriteOptions(false);
                    navigation.navigate("STT");
                  }}
                  style={{ backgroundColor: THEMES[appTheme].accent }}
                  className="w-20 h-20 rounded-[30px] items-center justify-center shadow-2xl mb-3"
                >
                  <Mic size={32} color={THEMES[appTheme].bg} />
                </TouchableOpacity>
                <Text style={{ color: THEMES[appTheme].accent }} className="font-bold">
                  음성으로
                </Text>
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={() => {
                    setShowWriteOptions(false);
                    navigation.navigate("Write");
                  }}
                  style={{ backgroundColor: THEMES[appTheme].text }}
                  className="w-20 h-20 rounded-[30px] items-center justify-center shadow-2xl mb-3"
                >
                  <PenTool size={32} color={THEMES[appTheme].bg} />
                </TouchableOpacity>
                <Text style={{ color: THEMES[appTheme].text }} className="font-bold">
                  글자로
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowWriteOptions(false)}
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="mt-12 w-14 h-14 rounded-full items-center justify-center border border-white/10"
            >
              <X size={24} color={THEMES[appTheme].text} opacity={0.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Side Menu Modal */}
        <Modal visible={showMenu} transparent={true} animationType="none" onRequestClose={() => setShowMenu(false)}>
          <View className="flex-1 flex-row">
            {/* Overlay */}
            <TouchableOpacity activeOpacity={1} onPress={() => setShowMenu(false)} className="flex-1 bg-black/60" />

            {/* Menu Content */}
            <View
              style={{ backgroundColor: THEMES[appTheme].bg }}
              className="w-72 h-full shadow-2xl border-l border-white/5 p-8"
            >
              <SafeAreaView className="flex-1">
                <View className="flex-row justify-between items-center mb-10">
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    >
                      <User size={24} color={THEMES[appTheme].accent} />
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].text }} className="text-lg font-bold">
                        {nickname}
                      </Text>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-[10px] font-bold opacity-60">
                        {status === "VIP" ? "VIP MEMBER" : "FREE MEMBER"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowMenu(false)}
                    className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
                  >
                    <X size={20} color={THEMES[appTheme].text} opacity={0.5} />
                  </TouchableOpacity>
                </View>

                <View className="space-y-4">
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={item.onPress}
                      style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                      className="flex-row items-center p-5 rounded-2xl border border-white/5 mb-4"
                    >
                      {item.icon}
                      <Text
                        style={{ color: item.isDanger ? "#E7433C" : THEMES[appTheme].text }}
                        className={`ml-4 text-[16px] font-medium`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {/* VIP 배너 - 나중 확장을 위해 숨김 */}
                  {/* {status !== "VIP" && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowMenu(false);
                        setShowStore(true);
                      }}
                      className="mt-6 p-6 rounded-[32px] bg-gradient-to-br from-[#00E0D0] to-[#00A89C] items-center relative overflow-hidden"
                      style={{ backgroundColor: "#00E0D0" }}
                    >
                      <View className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-full" />
                      <Gem size={32} color="#001220" />
                      <Text className="text-[#001220] font-bold text-lg mt-2">VIP 멤버십</Text>
                      <Text className="text-[#001220]/60 text-xs mt-1 text-center">
                        광고 제거 및{"\n"}무제한 파도 즐기기
                      </Text>
                    </TouchableOpacity>
                  )} */}
                </View>

                <View className="mt-auto items-center pb-8 border-t border-white/5 pt-8">
                  <Text style={{ color: THEMES[appTheme].text }} className="opacity-20 text-[10px] tracking-[2px]">
                    SWELL v1.0.0
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          </View>
        </Modal>

        {/* Onboarding Guide Modal */}
        <Modal visible={showOnboarding} transparent={true} animationType="fade">
          <View
            style={{ backgroundColor: THEMES[appTheme].bg + "F2" }}
            className="flex-1 items-center justify-center p-8"
          >
            <AnimatedReanimated.View
              entering={FadeInUp}
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="p-10 rounded-[40px] border border-white/5 w-full items-center"
            >
              <View
                style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
                className="w-24 h-24 rounded-full items-center justify-center mb-8"
              >
                {React.cloneElement(onboardingData[onboardingStep].icon as React.ReactElement, {
                  color: THEMES[appTheme].accent,
                })}
              </View>

              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-4 text-center">
                {onboardingData[onboardingStep].title}
              </Text>

              <Text
                style={{ color: THEMES[appTheme].text }}
                className="opacity-60 text-center leading-7 mb-10 text-base"
              >
                {onboardingData[onboardingStep].content}
              </Text>

              {/* Step Indicators */}
              <View className="flex-row space-x-2 mb-10">
                {onboardingData.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: onboardingStep === i ? THEMES[appTheme].accent : THEMES[appTheme].text + "1A",
                    }}
                    className={`h-1.5 rounded-full ${onboardingStep === i ? "w-8" : "w-2"}`}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleNextOnboarding}
                style={{ backgroundColor: THEMES[appTheme].accent }}
                className="py-5 px-10 rounded-2xl w-full items-center shadow-lg"
              >
                <Text style={{ color: THEMES[appTheme].bg }} className="font-bold text-lg">
                  {onboardingStep === onboardingData.length - 1 ? "너울 시작하기" : "다음으로"}
                </Text>
              </TouchableOpacity>
            </AnimatedReanimated.View>
          </View>
        </Modal>

        {/* Report & Block Modal */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View
              style={{ backgroundColor: THEMES[appTheme].bg }}
              className="rounded-t-[50px] p-10 border-t border-white/10"
            >
              <View className="flex-row justify-between items-center mb-8">
                <View>
                  <Text className="text-[#E7433C] text-[10px] font-bold tracking-[2px] mb-2 uppercase">REPORT</Text>
                  <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                    신고 및 차단
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowReportModal(false)}
                  style={{ backgroundColor: THEMES[appTheme].surface }}
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                >
                  <X size={24} color={THEMES[appTheme].text} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: THEMES[appTheme].text }} className="opacity-60 text-sm mb-6 leading-6">
                {reportType === "post"
                  ? "이 게시글을 신고하는 사유를 선택해 주세요.\n부적절한 게시글은 검토 후 처리됩니다."
                  : `${selectedUserToReport?.nickname}님을 신고하는 사유를 선택해 주세요.\n누적 신고 시 서비스 이용이 제한될 수 있습니다.`}
              </Text>

              {/* Reasons List */}
              <View className="space-y-3 mb-8">
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => setReportReason(reason)}
                    style={{
                      backgroundColor: reportReason === reason ? "#E7433C1A" : THEMES[appTheme].surface + "66",
                      borderColor: reportReason === reason ? "#E7433C66" : "rgba(255,255,255,0.05)",
                    }}
                    className={`flex-row items-center p-5 rounded-2xl border`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-4 ${
                        reportReason === reason ? "border-[#E7433C]" : "border-white/20"
                      }`}
                    >
                      {reportReason === reason && <View className="w-2.5 h-2.5 rounded-full bg-[#E7433C]" />}
                    </View>
                    <Text
                      style={{ color: reportReason === reason ? THEMES[appTheme].text : THEMES[appTheme].text + "66" }}
                      className={`font-medium`}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Block Option */}
              <TouchableOpacity
                onPress={() => setIsBlockChecked(!isBlockChecked)}
                style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
                className="flex-row items-center p-6 rounded-3xl mb-10 border border-white/5"
              >
                <View
                  className={`w-6 h-6 rounded-lg items-center justify-center mr-4 border ${
                    isBlockChecked ? "bg-[#E7433C] border-[#E7433C]" : "border-white/20"
                  }`}
                >
                  {isBlockChecked && <View className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-1" />}
                </View>
                <View>
                  <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-base">
                    이 사용자 차단하기
                  </Text>
                  <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 text-xs mt-1">
                    이 사용자의 글이 메인에 더 이상 노출되지 않습니다.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={submitReport}
                className="bg-[#E7433C] py-6 rounded-[30px] items-center justify-center shadow-lg shadow-[#E7433C]/20"
              >
                <Text className="text-white font-black text-lg">신고 및 차단 완료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Token Store Modal */}
        <Modal visible={showStore} transparent={true} animationType="slide" onRequestClose={() => setShowStore(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              style={{ backgroundColor: THEMES[appTheme].bg }}
              className="rounded-t-[50px] p-10 border-t border-white/10"
            >
              <View className="flex-row justify-between items-center mb-10">
                <View>
                  <Text
                    style={{ color: THEMES[appTheme].accent }}
                    className="text-[10px] font-bold tracking-[3px] mb-2 uppercase"
                  >
                    SHOP
                  </Text>
                  <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                    너울 상점
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowStore(false)}
                  style={{ backgroundColor: THEMES[appTheme].surface }}
                  className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
                >
                  <X size={24} color={THEMES[appTheme].text} />
                </TouchableOpacity>
              </View>

              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "4D" }}
                className="p-8 rounded-[40px] flex-row justify-between items-center mb-10 border border-white/5"
              >
                <View>
                  <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-xs font-bold mb-2">
                    현재 내 토큰
                  </Text>
                  <View className="flex-row items-center">
                    <Gem size={24} color={THEMES[appTheme].accent} />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-3xl font-black ml-3">
                      {status === "VIP" ? "무제한" : dailyFreeTokens + totalTokens}
                    </Text>
                  </View>
                </View>
                {status !== "VIP" && (
                  <View className="items-end">
                    <Text
                      style={{ color: THEMES[appTheme].text }}
                      className="opacity-20 text-[10px] font-bold uppercase tracking-tighter"
                    >
                      Daily Free Incl.
                    </Text>
                    <Text style={{ color: THEMES[appTheme].accent }} className="text-xs font-black mt-2">
                      VIP 승급 가능
                    </Text>
                  </View>
                )}
              </View>

              <View className="space-y-4 mb-10">
                <Text
                  style={{ color: THEMES[appTheme].text }}
                  className="opacity-40 text-[10px] font-bold tracking-widest uppercase mb-4 pl-2"
                >
                  Token Packages
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    buyTokens(30);
                    Alert.alert("구매 완료", "토큰 30개가 충전되었습니다.");
                  }}
                  style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                  className="flex-row items-center justify-between p-6 rounded-[32px] border border-white/5 mb-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    >
                      <Coins size={28} color={THEMES[appTheme].accent} />
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-lg">
                        토큰 30개
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 text-[10px] mt-1">
                        즉시 충전 및 사용 가능
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: THEMES[appTheme].accent }} className="px-5 py-3 rounded-2xl">
                    <Text style={{ color: THEMES[appTheme].bg }} className="font-black text-sm">
                      ₩1,100
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    buyTokens(100);
                    Alert.alert("구매 완료", "토큰 100개가 충전되었습니다.");
                  }}
                  style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                  className="flex-row items-center justify-between p-6 rounded-[32px] border border-white/5 mb-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    >
                      <Gem size={28} color={THEMES[appTheme].accent} />
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-lg">
                        토큰 100개
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 text-[10px] mt-1">
                        대용량 패키지 10% 추가
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: THEMES[appTheme].accent }} className="px-5 py-3 rounded-2xl">
                    <Text style={{ color: THEMES[appTheme].bg }} className="font-black text-sm">
                      ₩3,300
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    upgradeToVIP();
                    Alert.alert("승급 완료", "VIP 멤버십이 활성화되었습니다!");
                    setShowStore(false);
                  }}
                  style={{
                    backgroundColor: THEMES[appTheme].accent + "1A",
                    borderColor: THEMES[appTheme].accent + "33",
                  }}
                  className="flex-row items-center justify-between p-6 rounded-[32px] border mb-6 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-lg"
                    >
                      <CheckCircle2 size={28} color={THEMES[appTheme].bg} />
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-lg">
                        월 정기 VIP
                      </Text>
                      <Text
                        style={{ color: THEMES[appTheme].accent }}
                        className="font-bold text-[10px] mt-1 tracking-tighter"
                      >
                        모든 기능 무제한 이용
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{ backgroundColor: THEMES[appTheme].bg }}
                    className="px-5 py-3 rounded-2xl border border-white/10"
                  >
                    <Text style={{ color: THEMES[appTheme].text }} className="font-black text-sm">
                      ₩5,500
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Purchase Notice */}
              <View
                style={{ backgroundColor: THEMES[appTheme].text + "08" }}
                className="p-6 rounded-3xl border border-white/5 items-center mb-8"
              >
                <Text style={{ color: "#E7433C" }} className="font-black text-xs mb-2">
                  ⚠️ 사용 후 환불 불가 안내
                </Text>
                <Text style={{ color: THEMES[appTheme].text }} className="text-[11px] leading-5 text-center opacity-40">
                  '너울'의 유료 상품은 구매 즉시 효력이 발생하거나{"\n"}
                  사용이 시작되므로, 사용 후에는 환불이 불가합니다.{"\n"}
                  결제 전 상품 구성을 반드시 확인해 주세요.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
        {/* Author Profile Modal */}
        <Modal visible={showAuthorProfile} animationType="slide" transparent={true}>
          <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-20">
            <View
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="flex-1 rounded-t-[50px] border-t border-white/10 shadow-2xl"
            >
              <View className="px-8 pt-8 pb-4 flex-row justify-between items-center">
                <View className="items-center">
                  <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black tracking-tighter">
                    너울
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAuthorProfile(false)}
                  className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
                >
                  <X size={20} color={THEMES[appTheme].text} />
                </TouchableOpacity>
              </View>

              {isAuthorLoading ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color={THEMES[appTheme].accent} />
                </View>
              ) : authorProfile ? (
                <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
                  {/* Author Header */}
                  <View
                    style={{ backgroundColor: THEMES[appTheme].surface + "4D" }}
                    className="items-center mt-6 mb-10 p-10 rounded-[40px] border border-white/5"
                  >
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
                      className="w-20 h-20 rounded-[28px] items-center justify-center mb-4"
                    >
                      <User size={40} color={THEMES[appTheme].accent} />
                    </View>

                    <View className="flex-row items-center mb-6">
                      {authorProfile.id !== userId && (
                        <TouchableOpacity
                          onPress={() => handleReportMember(authorProfile.id, authorProfile.nickname)}
                          className="mr-3 bg-[#E7433C]/10 px-4 py-2 rounded-xl flex-row items-center border border-[#E7433C]/20"
                        >
                          <AlertCircle size={14} color="#E7433C" />
                          <Text className="text-[#E7433C] text-[10px] font-bold ml-1">신고</Text>
                        </TouchableOpacity>
                      )}

                      {authorProfile.id !== userId && (
                        <TouchableOpacity
                          onPress={() => handleBlock(authorProfile.id, authorProfile.nickname)}
                          className="bg-white/5 px-4 py-2 rounded-xl flex-row items-center border border-white/5"
                        >
                          <Ban size={14} color={THEMES[appTheme].text} opacity={0.3} />
                          <Text
                            style={{ color: THEMES[appTheme].text }}
                            className="text-[10px] font-bold ml-1 opacity-40"
                          >
                            차단
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-2">
                      {authorProfile.nickname}
                    </Text>

                    {authorProfile.id !== userId && (
                      <TouchableOpacity
                        onPress={() => handleToggleFollow(authorProfile.id, authorProfile.nickname)}
                        style={{
                          backgroundColor: following.some((f) => f.id === authorProfile.id)
                            ? "transparent"
                            : THEMES[appTheme].accent,
                          borderColor:
                            THEMES[appTheme].accent + (following.some((f) => f.id === authorProfile.id) ? "4D" : ""),
                        }}
                        className={`mt-4 px-10 py-4 rounded-[24px] flex-row items-center border shadow-sm`}
                      >
                        {following.some((f) => f.id === authorProfile.id) ? (
                          <>
                            <User size={18} color={THEMES[appTheme].accent} />
                            <Text style={{ color: THEMES[appTheme].accent }} className="font-bold ml-2 text-base">
                              언팔로우 하기
                            </Text>
                          </>
                        ) : (
                          <>
                            <User size={18} color={THEMES[appTheme].bg} />
                            <Text style={{ color: THEMES[appTheme].bg }} className="font-bold ml-2 text-base">
                              이 회원 팔로우
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Author Stats Row */}
                  <View className="flex-row justify-between mb-10">
                    {[
                      {
                        label: "팔로워",
                        value: following.some((f) => f.id === authorProfile.id)
                          ? authorProfile.followers + 1
                          : authorProfile.followers,
                        icon: <User size={14} color={THEMES[appTheme].accent} />,
                      },
                      { label: "공감", value: authorProfile.receivedLikes, icon: <Heart size={14} color="#FF6B6B" /> },
                      {
                        label: "게시글",
                        value: authorProfile.postCount,
                        icon: <MessageSquare size={14} color="#E0E0E0" />,
                      },
                    ].map((stat, i) => (
                      <View
                        key={i}
                        style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                        className="flex-1 mx-1.5 p-5 rounded-[25px] items-center border border-white/5"
                      >
                        <Text className="text-white text-lg font-bold mb-1">{stat.value}</Text>
                        <View className="flex-row items-center opacity-40">
                          {stat.icon}
                          <Text className="text-[#E0E0E0] text-[10px] font-bold ml-1">{stat.label}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Author Posts List (Simple) */}
                  <View className="mb-20">
                    <View className="flex-row justify-between items-center mb-6 px-2">
                      <Text className="text-[#E0E0E0]/40 text-xs font-bold tracking-widest uppercase">
                        Recent Waves
                      </Text>
                    </View>

                    {authorProfile.posts &&
                      authorProfile.posts.slice(0, 10).map((p: any) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setShowAuthorProfile(false);
                            navigation.push("PostDetail", { post: { ...p, nickname: authorProfile.nickname } });
                          }}
                          style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
                          className="p-6 rounded-[30px] border border-white/5 mb-4"
                        >
                          <Text className="text-white text-base font-bold mb-2">{p.title}</Text>
                          <Text
                            style={{ color: THEMES[appTheme].text }}
                            className="opacity-40 text-sm mb-4"
                            numberOfLines={2}
                          >
                            {p.content}
                          </Text>
                          <View className="flex-row justify-between items-center mt-2">
                            <Text style={{ color: THEMES[appTheme].accent }} className="text-[10px] font-bold">
                              {authorProfile.nickname}
                            </Text>
                            <Text style={{ color: THEMES[appTheme].text }} className="opacity-10 text-[10px]">
                              {p.time}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}

                    {authorProfile.postCount > 10 && (
                      <TouchableOpacity className="py-4 items-center">
                        <Text style={{ color: THEMES[appTheme].accent }} className="text-xs font-bold">
                          더 많은 이야기 불러오기
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
        {/* Notification Modal */}
        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-20">
            <View
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="flex-1 rounded-t-[50px] border-t border-white/10 shadow-2xl"
            >
              <View className="px-8 pt-8 pb-4 flex-row justify-between items-center">
                <View className="w-10 h-10" />
                <Text
                  style={{ color: THEMES[appTheme].text }}
                  className="text-[10px] font-bold tracking-[3px] opacity-30"
                >
                  NOTIFICATIONS
                </Text>
                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  className="w-10 h-10 bg-white/5 rounded-full items-center justify-center"
                >
                  <X size={20} color={THEMES[appTheme].text} />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View className="flex-1 items-center justify-center pt-20">
                    <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-sm">
                      새로운 알림이 없습니다.
                    </Text>
                  </View>
                ) : (
                  notifications.map((n) => (
                    <TouchableOpacity
                      key={n.id}
                      onPress={() => {
                        const newNotifications = notifications.map((notif) =>
                          notif.id === n.id ? { ...notif, isRead: true } : notif,
                        );
                        setNotifications(newNotifications);
                      }}
                      style={{
                        backgroundColor: n.isRead ? "transparent" : THEMES[appTheme].text + "08",
                        borderColor: n.isRead ? THEMES[appTheme].text + "0D" : THEMES[appTheme].accent + "4D",
                      }}
                      className="p-6 rounded-[30px] mb-4 border"
                    >
                      <View className="flex-row items-start">
                        <View
                          style={{
                            backgroundColor:
                              n.type === "like"
                                ? "#FF6B6B22"
                                : n.type === "comment"
                                  ? THEMES[appTheme].accent + "22"
                                  : n.type === "follow"
                                    ? "#4D96FF22"
                                    : "#FFD93D22",
                          }}
                          className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
                        >
                          {n.type === "like" && <Heart size={18} color="#FF6B6B" fill="#FF6B6B" />}
                          {n.type === "comment" && <MessageSquare size={18} color={THEMES[appTheme].accent} />}
                          {n.type === "follow" && <User size={18} color="#4D96FF" />}
                          {n.type === "event" && <Sparkles size={18} color="#FFD93D" />}
                          {n.type === "system" && <ShieldCheck size={18} color={THEMES[appTheme].accent} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            style={{ color: THEMES[appTheme].text }}
                            className={`text-[15px] leading-6 mb-2 ${n.isRead ? "opacity-60" : "font-semibold"}`}
                          >
                            {n.content}
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-[10px] opacity-20 font-bold">
                            {n.time}
                          </Text>
                        </View>
                        {!n.isRead && <View className="w-2 h-2 bg-[#E7433C] rounded-full mt-2 ml-2" />}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                <View className="h-20" />
              </ScrollView>

              <TouchableOpacity
                onPress={() => {
                  const readAll = notifications.map((n) => ({ ...n, isRead: true }));
                  setNotifications(readAll);
                }}
                className="mx-8 mb-10 py-5 rounded-3xl border border-white/10 items-center"
              >
                <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold opacity-40">
                  모든 알림 읽음 처리
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
