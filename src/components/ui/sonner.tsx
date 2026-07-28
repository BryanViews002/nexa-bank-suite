import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0c0f16] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-2xl font-mono rounded-none border-[1px]",
          description: "group-[.toast]:text-muted-foreground font-sans",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground rounded-none",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground rounded-none",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
