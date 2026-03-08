import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Button } from "./ui/button";
import { Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { formatPhoneNumber } from "../utils/formatters";

interface ContactMenuProps {
  phoneNumber: string;
  name?: string;
  children: React.ReactNode;
}

export function ContactMenu({ phoneNumber, name, children }: ContactMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DrawerTrigger>
      <DrawerContent onClick={(e) => e.stopPropagation()}>
        <DrawerHeader>
          <DrawerTitle className="text-center">{name || formatPhoneNumber(phoneNumber)}</DrawerTitle>
          <DrawerDescription className="sr-only">Choose how you would like to connect.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-4">
          <a href={`tel:${phoneNumber}`} className="w-full">
            <Button className="w-full h-12 text-lg gap-2" variant="outline" size="lg">
              <Phone className="w-5 h-5" />
              Call {formatPhoneNumber(phoneNumber)}
            </Button>
          </a>
          <a href={`sms:${phoneNumber}`} className="w-full">
            <Button className="w-full h-12 text-lg gap-2" variant="outline" size="lg">
              <MessageCircle className="w-5 h-5" />
              Text {formatPhoneNumber(phoneNumber)}
            </Button>
          </a>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
