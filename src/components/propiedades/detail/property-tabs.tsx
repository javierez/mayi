"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { MediaManager, type MediaType } from "./media/media-manager";
import { PortalSelection } from "./portal-selection";
import { DocumentsManager } from "./documents-manager";
import { CartelesManager } from "./carteles-manager";
import { Tareas } from "./tareas";
import { Comments } from "./comments";
import { ActivityTabContent } from "./activity/activity-tab-content";
import { PropertyCharacteristicsForm } from "~/components/propiedades/form/property-characteristics-form";
import { CharacteristicsSkeleton } from "./skeletons";
import { ActivitySkeleton } from "~/components/ui/skeletons/activity-skeleton";
import { useSession } from "~/lib/auth-client";
import type { PropertyImage } from "~/lib/data";
import type { PropertyListing } from "~/types/property-listing";
import {
  getListingTasksWithAuth,
  updateListingTaskWithAuth,
  deleteListingTaskWithAuth,
} from "~/server/queries/task";
import { getCommentsByListingIdWithAuth } from "~/server/queries/comments";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "~/server/actions/comments";
import type { CommentWithUser } from "~/types/comments";
import {
  getListingVisitsSummary,
  getListingContactsSummary,
} from "~/server/queries/activity";
import type { VisitWithDetails, ContactWithDetails } from "~/types/activity";
import { toast } from "sonner";

// Cartel type that matches what CartelesManager component expects
interface Cartel {
  docId: bigint;
  filename: string;
  fileUrl: string;
  documentKey: string;
  uploadedAt: Date;
}

// Task type that matches what Tareas component expects
interface TaskWithId {
  taskId?: bigint;
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  listingId?: bigint;
  leadId?: bigint;
  dealId?: bigint;
  appointmentId?: bigint;
  prospectId?: bigint;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  relatedContact?: {
    contactId: bigint;
    name: string;
    email?: string;
  };
}

interface PropertyTabsProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    propertyType?: string | null;
    street?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    referenceNumber?: string | null;
    price: string;
    listingType: string;
    isBankOwned?: boolean | null;
    isFeatured?: boolean | null;
    neighborhood?: string | null;
    title?: string | null;
    fotocasa?: boolean | null;
    idealista?: boolean | null;
    habitaclia?: boolean | null;
    milanuncios?: boolean | null;
    fotocasaProps?: unknown;
    idealistaProps?: unknown;
    habitacliaProps?: unknown;
    milanunciosProps?: unknown;
    energyCertification?: string | null;
    agentId?: string | null; // Changed from bigint to match users.id type
  };
  images: PropertyImage[];
  videos: PropertyImage[];
  youtubeLinks: PropertyImage[];
  virtualTours: PropertyImage[];
  energyCertificate?: {
    docId: bigint;
    documentKey: string;
    fileUrl: string;
  } | null;
  convertedListing?: PropertyListing;
  canEdit?: boolean; // Permission flag to control editing capabilities
}

export function PropertyTabs({
  listing,
  convertedListing,
  images,
  videos,
  youtubeLinks,
  virtualTours,
  energyCertificate,
  canEdit = true, // Default to true for backward compatibility
}: PropertyTabsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam ?? "general");
  const [selectedMediaType, setSelectedMediaType] =
    useState<MediaType>("images");
  const [tabData, setTabData] = useState<{
    images: PropertyImage[] | null;
    videos: PropertyImage[] | null;
    youtubeLinks: PropertyImage[] | null;
    virtualTours: PropertyImage[] | null;
    convertedListing: PropertyListing | null | undefined;
    energyCertificate: {
      docId: bigint;
      documentKey: string;
      fileUrl: string;
    } | null;
    tasks: TaskWithId[] | null;
    agents:
      | { id: string; name: string; firstName?: string; lastName?: string }[]
      | null;
    comments: CommentWithUser[] | null;
    carteles: Cartel[] | null;
    portals: {
      platformStates: Record<string, boolean>; // Which portals are toggled on/off
      visibilityModes: Record<string, number>;
      hidePriceModes: Record<string, boolean>;
    } | null;
    visits: VisitWithDetails[] | null;
    contacts: ContactWithDetails[] | null;
  }>({
    images: images ?? null,
    videos: videos ?? null,
    youtubeLinks: youtubeLinks ?? null,
    virtualTours: virtualTours ?? null,
    convertedListing: convertedListing ?? null,
    energyCertificate: energyCertificate ?? null,
    tasks: null,
    agents: null,
    comments: null,
    carteles: null,
    portals: null,
    visits: null,
    contacts: null,
  });
  const [loading, setLoading] = useState<{
    caracteristicas: boolean;
    tasks: boolean;
    agents: boolean;
    comments: boolean;
    carteles: boolean;
    activity: boolean;
  }>({
    caracteristicas: false,
    tasks: false,
    agents: false,
    comments: false,
    carteles: false,
    activity: false,
  });

  // These are no longer needed - data comes from props
  // Removing to prevent redundant API calls

  const fetchTasksData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, tasks: true }));
    try {
      const tasksData = await getListingTasksWithAuth(
        Number(listing.listingId),
      );
      const tasksWithId = tasksData.map((task) => {
        // Create relatedContact object if contact data exists
        const relatedContact =
          task.contactId && (task.contactFirstName ?? task.contactLastName)
            ? {
                contactId: BigInt(task.contactId),
                name: `${task.contactFirstName ?? ""} ${task.contactLastName ?? ""}`.trim(),
                email: task.contactEmail ?? undefined,
              }
            : undefined;

        const mappedTask = {
          ...task,
          id: task.taskId.toString(),
          taskId: BigInt(task.taskId),
          leadId: task.listingContactId
            ? BigInt(task.listingContactId)
            : undefined,
          listingId: task.listingId ? BigInt(task.listingId) : undefined,
          dealId: task.dealId ? BigInt(task.dealId) : undefined,
          appointmentId: task.appointmentId
            ? BigInt(task.appointmentId)
            : undefined,
          prospectId: task.prospectId ? BigInt(task.prospectId) : undefined,
          dueDate: task.dueDate ?? undefined,
          completed: task.completed ?? false,
          isActive: task.isActive ?? true,
          updatedAt: task.updatedAt ?? undefined,
          userLastName: task.userLastName ?? undefined,
          relatedContact,
        };

        console.log(
          "Task mapping - createdBy:",
          task.createdBy,
          "taskId:",
          task.taskId,
        );

        return mappedTask;
      });
      setTabData((prev) => ({ ...prev, tasks: tasksWithId }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTabData((prev) => ({ ...prev, tasks: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  }, [listing.listingId]); // Removed tabData.tasks dependency to prevent infinite loop

  // Task update functions
  const handleToggleTaskCompleted = async (taskId: string) => {
    const tasks = tabData.tasks ?? [];
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.taskId) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setTabData((prev) => ({
      ...prev,
      tasks:
        prev.tasks?.map((t) =>
          t.id === taskId ? { ...t, completed: newCompleted } : t,
        ) ?? null,
    }));

    try {
      await updateListingTaskWithAuth(Number(task.taskId), {
        completed: newCompleted,
        completedBy: newCompleted ? session?.user?.id : null,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert optimistic update on error
      setTabData((prev) => ({
        ...prev,
        tasks:
          prev.tasks?.map((t) =>
            t.id === taskId ? { ...t, completed: !newCompleted } : t,
          ) ?? null,
      }));
      toast.error("Error al actualizar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const tasks = tabData.tasks ?? [];
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.taskId) return;

    // Optimistic update: remove from UI immediately
    const previousTasks = tabData.tasks;
    setTabData((prev) => ({
      ...prev,
      tasks: prev.tasks?.filter((t) => t.id !== taskId) ?? null,
    }));

    try {
      await deleteListingTaskWithAuth(Number(task.taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert optimistic update on error
      setTabData((prev) => ({
        ...prev,
        tasks: previousTasks,
      }));
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleAddTask = async (newTask: TaskWithId) => {
    // Add task optimistically
    setTabData((prev) => ({
      ...prev,
      tasks: prev.tasks ? [newTask, ...prev.tasks] : [newTask],
    }));
    return newTask;
  };

  const handleUpdateTaskAfterSave = (
    optimisticId: string,
    savedTask: TaskWithId,
  ) => {
    // Update with server response
    setTabData((prev) => ({
      ...prev,
      tasks:
        prev.tasks?.map((task) =>
          task.id === optimisticId ? savedTask : task,
        ) ?? null,
    }));
  };

  const handleRemoveOptimisticTask = (optimisticId: string) => {
    // Remove optimistic task on error
    setTabData((prev) => ({
      ...prev,
      tasks: prev.tasks?.filter((task) => task.id !== optimisticId) ?? null,
    }));
  };

  // Comment update functions
  const handleAddComment = async (
    tempComment: CommentWithUser,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await createCommentAction({
        listingId: tempComment.listingId,
        propertyId: tempComment.propertyId,
        content: tempComment.content,
        category: tempComment.category,
        parentId: tempComment.parentId,
      });

      if (result.success) {
        // Refresh comments data after successful creation
        await fetchCommentsData();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      return { success: false, error: "Error interno del servidor" };
    }
  };

  const handleEditComment = async (
    commentId: bigint,
    content: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateCommentAction({
        commentId,
        content,
      });

      if (result.success) {
        // Refresh comments data after successful update
        await fetchCommentsData();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      return { success: false, error: "Error interno del servidor" };
    }
  };

  const handleDeleteComment = async (
    commentId: bigint,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await deleteCommentAction(commentId);

      if (result.success) {
        // Refresh comments data after successful deletion
        await fetchCommentsData();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: "Error interno del servidor" };
    }
  };

  const fetchAgentsData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, agents: true }));
    try {
      // For now, just provide the current user until we implement proper API endpoint
      const agentsData = session?.user
        ? [
            {
              id: session.user.id,
              name: session.user.name || "",
              firstName: session.user.name?.split(" ")[0] ?? undefined,
              lastName: session.user.name?.split(" ")[1] ?? undefined,
            },
          ]
        : [];
      setTabData((prev) => ({ ...prev, agents: agentsData }));
    } catch (error) {
      console.error("Error fetching agents:", error);
      setTabData((prev) => ({ ...prev, agents: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, agents: false }));
    }
  }, [session?.user]); // Removed tabData.agents dependency to prevent infinite loop

  const fetchCommentsData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, comments: true }));
    try {
      const commentsData = await getCommentsByListingIdWithAuth(
        listing.listingId,
      );
      setTabData((prev) => ({ ...prev, comments: commentsData }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setTabData((prev) => ({ ...prev, comments: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, comments: false }));
    }
  }, [listing.listingId]); // Removed tabData.comments dependency to prevent infinite loop

  const fetchCartelesData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, carteles: true }));
    try {
      const response = await fetch(
        `/api/properties/${listing.listingId}/carteles`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch carteles");
      }
      const data = (await response.json()) as { documents?: Cartel[] };
      setTabData((prev) => ({ ...prev, carteles: data.documents ?? [] }));
    } catch (error) {
      console.error("Error fetching carteles:", error);
      setTabData((prev) => ({ ...prev, carteles: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, carteles: false }));
    }
  }, [listing.listingId]); // Removed tabData.carteles dependency to prevent infinite loop

  const fetchActivityData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, activity: true }));
    try {
      const [visitsData, contactsData] = await Promise.all([
        getListingVisitsSummary(listing.listingId),
        getListingContactsSummary(listing.listingId),
      ]);
      setTabData((prev) => ({
        ...prev,
        visits: visitsData,
        contacts: contactsData,
      }));
    } catch (error) {
      console.error("Error fetching activity data:", error);
      setTabData((prev) => ({ ...prev, visits: [], contacts: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, activity: false }));
    }
  }, [listing.listingId]);

  const handlePortalStateChange = (
    platformStates: Record<string, boolean>,
    visibilityModes: Record<string, number>,
    hidePriceModes: Record<string, boolean>,
  ) => {
    setTabData((prev) => ({
      ...prev,
      portals: {
        platformStates,
        visibilityModes,
        hidePriceModes,
      },
    }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with tab parameter
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?tab=${value}`, { scroll: false });
  };

  // Fetch only the data that's not provided as props, and only once on mount
  useEffect(() => {
    // Only fetch data that's not provided via props
    if (!tabData.tasks) {
      void fetchTasksData();
    }
    if (!tabData.agents) {
      void fetchAgentsData();
    }
    if (!tabData.comments) {
      void fetchCommentsData();
    }
    if (!tabData.carteles) {
      void fetchCartelesData();
    }
    if (!tabData.visits || !tabData.contacts) {
      void fetchActivityData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run once on mount only

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="mt-8 w-full md:mt-0"
    >
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 md:h-10 md:grid-cols-6 md:gap-0">
        <TabsTrigger
          value="general"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          General
        </TabsTrigger>
        <TabsTrigger
          value="tareas"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Tareas y notas
        </TabsTrigger>
        <TabsTrigger
          value="imagenes"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Imágenes
        </TabsTrigger>
        <TabsTrigger
          value="actividad"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Actividad
        </TabsTrigger>
        <TabsTrigger
          value="portales"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Portales
        </TabsTrigger>
        <TabsTrigger
          value="documentos"
          className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Archivos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-4xl">
          {loading.caracteristicas ? (
            <CharacteristicsSkeleton />
          ) : (tabData.convertedListing ?? convertedListing) ? (
            <PropertyCharacteristicsForm
              listing={tabData.convertedListing ?? convertedListing!}
            />
          ) : (
            <div className="py-8 text-center">
              <p>No se pudo cargar la información de la propiedad</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="tareas" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left side - Tasks */}
            <div className="flex-1 lg:w-1/2">
              <Tareas
                propertyId={listing.propertyId}
                listingId={listing.listingId}
                referenceNumber={listing.referenceNumber ?? ""}
                tasks={tabData.tasks ?? []}
                loading={loading.tasks}
                onToggleCompleted={handleToggleTaskCompleted}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                onUpdateTaskAfterSave={handleUpdateTaskAfterSave}
                onRemoveOptimisticTask={handleRemoveOptimisticTask}
              />
            </div>

            {/* Right side - Comments */}
            <div className="flex-1 lg:w-1/2">
              <h3 className="mb-2 text-lg font-semibold sm:text-xl">Notas</h3>
              <Comments
                propertyId={listing.propertyId}
                listingId={listing.listingId}
                referenceNumber={listing.referenceNumber ?? ""}
                initialComments={tabData.comments ?? []}
                loading={loading.comments}
                currentUserId={session?.user?.id}
                currentUser={
                  session?.user
                    ? {
                        id: session.user.id,
                        name: session.user.name ?? undefined,
                        image: session.user.image ?? undefined,
                      }
                    : undefined
                }
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="imagenes" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-3xl">
          <MediaManager
            images={tabData.images ?? images}
            videos={tabData.videos ?? []}
            youtubeLinks={tabData.youtubeLinks ?? []}
            virtualTours={tabData.virtualTours ?? virtualTours}
            title={listing.title ?? ""}
            propertyId={BigInt(listing.propertyId)}
            referenceNumber={listing.referenceNumber ?? ""}
            onImageUploaded={(image) => {
              setTabData((prev) => ({
                ...prev,
                images: prev.images ? [...prev.images, image] : [image],
              }));
            }}
            onVideoUploaded={(video) => {
              setTabData((prev) => ({
                ...prev,
                videos: prev.videos ? [...prev.videos, video] : [video],
              }));
            }}
            onYouTubeLinkAdded={(link) => {
              setTabData((prev) => ({
                ...prev,
                youtubeLinks: prev.youtubeLinks
                  ? [...prev.youtubeLinks, link]
                  : [link],
              }));
            }}
            onVirtualTourAdded={(tour) => {
              setTabData((prev) => ({
                ...prev,
                virtualTours: prev.virtualTours
                  ? [...prev.virtualTours, tour]
                  : [tour],
              }));
            }}
            onMediaTypeChange={setSelectedMediaType}
            canEdit={canEdit}
          />
          {selectedMediaType === "images" && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={() =>
                  router.push(`/propiedades/${listing.listingId}/image-studio`)
                }
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-amber-500 hover:to-rose-500 hover:shadow-xl active:scale-95"
              >
                Vesta Image Studio
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="actividad" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-7xl">
          {loading.activity ? (
            <ActivitySkeleton />
          ) : tabData.visits && tabData.contacts ? (
            <ActivityTabContent
              visits={tabData.visits}
              contacts={tabData.contacts}
              listingId={listing.listingId}
              listingPrice={listing.price}
              onRefresh={fetchActivityData}
            />
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-500">
                No se pudo cargar la información de actividad
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="portales" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-4xl">
          <PortalSelection
            listingId={listing.listingId.toString()}
            fotocasa={listing.fotocasa ?? undefined}
            idealista={listing.idealista ?? undefined}
            habitaclia={listing.habitaclia ?? undefined}
            milanuncios={listing.milanuncios ?? undefined}
            fotocasaProps={listing.fotocasaProps ?? undefined}
            idealistaProps={listing.idealistaProps ?? undefined}
            habitacliaProps={listing.habitacliaProps ?? undefined}
            milanunciosProps={listing.milanunciosProps ?? undefined}
            initialPlatformStates={tabData.portals?.platformStates}
            initialVisibilityModes={tabData.portals?.visibilityModes}
            initialHidePriceModes={tabData.portals?.hidePriceModes}
            onPortalStateChange={handlePortalStateChange}
          />
        </div>
      </TabsContent>

      <TabsContent value="documentos" className="mt-8 sm:mt-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left side - Documents */}
            <div className="flex-1 lg:w-1/2">
              <DocumentsManager
                propertyId={listing.propertyId}
                listingId={listing.listingId}
                referenceNumber={listing.referenceNumber ?? ""}
              />
            </div>

            {/* Right side - Carteles */}
            <div className="flex-1 lg:w-1/2">
              <CartelesManager
                propertyId={listing.propertyId}
                listingId={listing.listingId}
                referenceNumber={listing.referenceNumber ?? ""}
                carteles={tabData.carteles ?? []}
                loading={loading.carteles}
                onRefreshCarteles={fetchCartelesData}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
